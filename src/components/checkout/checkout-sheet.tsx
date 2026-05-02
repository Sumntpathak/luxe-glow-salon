import { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  X, Plus, Percent, CreditCard, DollarSign, Gift, Receipt as ReceiptIcon,
  Check, Mail, Send, Printer, Sparkles,
} from 'lucide-react';
import { Booking, ReceiptLineItem, ReceiptPayment, SavedCard, PaymentMethod, Receipt } from '@/types';
import { useStore } from '@/lib/store';
import { useTenantBookings, useTenantServices, useTenantStaff, useTenantClients, useTenantProducts } from '@/lib/store/hooks';
import { computeTotals, applyLineDiscount, suggestedTips, DiscountInput } from '@/lib/checkout/calculator';

// ── MGN-601/602/603/604 — single-sheet checkout flow ───────────────────────
// Three internal states: cart → paying → receipt. The same sheet stays open;
// the body swaps based on `phase`.

interface CheckoutSheetProps {
  /** Booking that initiated checkout. Pulls in all sibling bookings sharing groupId. */
  booking: Booking | null;
  onClose: () => void;
}

type Phase = 'cart' | 'paying' | 'receipt';

interface DraftLine extends ReceiptLineItem {
  /** Stable id for the row (so React keys + edits work even when description repeats). */
  draftId: string;
  discountInput: DiscountInput | null;
}

export default function CheckoutSheet({ booking, onClose }: CheckoutSheetProps) {
  const open = booking != null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex flex-col p-0 gap-0 w-[480px] sm:max-w-md">
        {booking && <CheckoutBody booking={booking} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function CheckoutBody({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const allBookings = useTenantBookings('org');
  const services = useTenantServices('org');
  const staff = useTenantStaff('org');
  const clients = useTenantClients();
  const products = useTenantProducts('org');
  const salonSettings = useStore((s) => s.salonSettings);
  const updateBooking = useStore((s) => s.updateBooking);
  const addReceipt = useStore((s) => s.addReceipt);
  const saveCardForClient = useStore((s) => s.saveCardForClient);
  const addEarning = useStore((s) => s.addEarning);
  const adjustStock = useStore((s) => s.adjustStock);

  // Group bookings — checkout pays for everything in this group at once.
  const groupBookings = useMemo<Booking[]>(() => {
    if (!booking.groupId) return [booking];
    return allBookings.filter((b) => b.groupId === booking.groupId);
  }, [allBookings, booking]);

  const client = clients.find((c) => c.id === booking.clientId);
  const closingStaff = staff.find((s) => s.id === booking.staffId);
  const taxRate = salonSettings.taxRate ?? 0.08875;

  // ── Cart lines ─────────────────────────────────────────────────────────
  const initialLines = useMemo<DraftLine[]>(() => {
    return groupBookings.map((b) => {
      const svc = services.find((s) => s.id === b.serviceId);
      return {
        draftId: `srv-${b.id}`,
        kind: 'service' as const,
        description: svc?.name ?? 'Service',
        quantity: 1,
        unitPrice: svc?.price ?? 0,
        discount: 0,
        discountInput: null,
        refId: b.id,
      };
    });
  }, [groupBookings, services]);

  const [lines, setLines] = useState<DraftLine[]>(initialLines);
  const [tip, setTip] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>('cart');
  const [pendingPayments, setPendingPayments] = useState<ReceiptPayment[]>([]);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);

  // Reset internal state when the booking changes (different appointment opened).
  useEffect(() => {
    setLines(initialLines);
    setTip(0);
    setPhase('cart');
    setPendingPayments([]);
    setSavedReceipt(null);
  }, [initialLines]);

  const totals = useMemo(() => computeTotals(lines, taxRate, tip), [lines, taxRate, tip]);

  const updateLine = useCallback((id: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l) => l.draftId === id ? { ...l, ...patch } : l));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.draftId !== id));
  }, []);

  const addProductLine = useCallback((productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((prev) => [...prev, {
      draftId: `prd-${productId}-${Date.now()}`,
      kind: 'product',
      description: p.name,
      quantity: 1,
      unitPrice: p.price,
      discount: 0,
      discountInput: null,
      refId: productId,
    }]);
  }, [products]);

  const setLineDiscount = useCallback((id: string, d: DiscountInput | null) => {
    setLines((prev) => prev.map((l) => {
      if (l.draftId !== id) return l;
      const discount = applyLineDiscount(l.unitPrice, l.quantity, d);
      return { ...l, discountInput: d, discount };
    }));
  }, []);

  // ── Submit / record payment ───────────────────────────────────────────
  const recordPayment = (method: PaymentMethod, amount: number, reference?: string) => {
    const next: ReceiptPayment[] = [...pendingPayments, { method, amount, reference }];
    setPendingPayments(next);
    const paid = next.reduce((s, p) => s + p.amount, 0);
    if (paid >= totals.total - 0.01) finalize(next);
  };

  const finalize = (payments: ReceiptPayment[]) => {
    const receipt = addReceipt({
      clientId: booking.clientId,
      bookingIds: groupBookings.map((b) => b.id),
      groupId: booking.groupId,
      staffId: booking.staffId,
      items: lines.map(({ draftId: _d, discountInput: _i, ...rest }) => rest),
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxRate,
      tax: totals.tax,
      tip: totals.tip,
      total: totals.total,
      payments,
    });

    // Mark all bookings completed + record earnings (commission on services only).
    for (const b of groupBookings) {
      updateBooking(b.id, { status: 'completed' });
      const svc = services.find((s) => s.id === b.serviceId);
      const st = staff.find((s) => s.id === b.staffId);
      if (svc && st) {
        addEarning({
          id: `earn-${Date.now()}-${b.id}`,
          staffId: b.staffId,
          bookingId: b.id,
          serviceAmount: svc.price,
          commissionAmount: round2(svc.price * (st.commissionPercent / 100)),
          tips: 0,
          date: b.date,
        });
      }
    }
    // Decrement stock for product lines.
    for (const l of lines) {
      if (l.kind === 'product' && l.refId) adjustStock(l.refId, -l.quantity);
    }

    setSavedReceipt(receipt);
    setPhase('receipt');
    toast.success(`Checkout complete — $${totals.total.toFixed(2)}`);
  };

  // ── Header ─────────────────────────────────────────────────────────────
  const Header = (
    <SheetHeader className="px-6 py-4 border-b">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={client?.avatar} alt={client?.name} />
          <AvatarFallback>{client?.name.charAt(0) ?? '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <SheetTitle className="text-base truncate">
            {phase === 'receipt' ? 'Receipt' : phase === 'paying' ? 'Take payment' : 'Checkout'}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {client?.name ?? 'Client'} · {format(new Date(booking.date), 'EEE, MMM d')} · {closingStaff?.name}
          </SheetDescription>
        </div>
      </div>
    </SheetHeader>
  );

  if (phase === 'receipt' && savedReceipt) {
    return (
      <>
        {Header}
        <ReceiptView
          receipt={savedReceipt}
          clientName={client?.name ?? 'Client'}
          clientEmail={client?.email}
          clientPhone={client?.phone}
          onClose={onClose}
        />
      </>
    );
  }

  if (phase === 'paying') {
    return (
      <>
        {Header}
        <PaymentPanel
          totals={totals}
          alreadyPaid={pendingPayments.reduce((s, p) => s + p.amount, 0)}
          savedCards={client?.savedCards ?? []}
          onCharge={recordPayment}
          onSaveCard={(card) => saveCardForClient(booking.clientId, card)}
          onBack={() => setPhase('cart')}
        />
      </>
    );
  }

  // ── Phase: cart ────────────────────────────────────────────────────────
  return (
    <>
      {Header}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Items</h3>
            <AddProductButton products={products} onPick={addProductLine} />
          </div>
          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Cart is empty.</p>
          ) : (
            <div className="space-y-1.5">
              {lines.map((l) => (
                <CartLineRow
                  key={l.draftId}
                  line={l}
                  onChangeQty={(q) => updateLine(l.draftId, {
                    quantity: q,
                    discount: applyLineDiscount(l.unitPrice, q, l.discountInput),
                  })}
                  onSetDiscount={(d) => setLineDiscount(l.draftId, d)}
                  onRemove={() => removeLine(l.draftId)}
                />
              ))}
            </div>
          )}
        </section>

        <Separator />

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Tip</h3>
          <TipRow taxableSubtotal={totals.taxableSubtotal} tip={tip} onChange={setTip} />
        </section>

        <Separator />

        <section className="space-y-1.5 text-sm">
          <Row label="Subtotal" value={totals.subtotal} />
          {totals.discountTotal > 0 && <Row label="Discounts" value={-totals.discountTotal} muted />}
          <Row label={`Tax (${(taxRate * 100).toFixed(2)}%)`} value={totals.tax} muted />
          {tip > 0 && <Row label="Tip" value={tip} muted />}
          <div className="flex justify-between pt-2 border-t border-border/50 font-semibold text-base">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </section>
      </div>

      <div className="px-6 py-4 border-t bg-background flex gap-2">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button
          className="flex-1"
          onClick={() => setPhase('paying')}
          disabled={lines.length === 0 || totals.total <= 0}
        >
          Charge ${totals.total.toFixed(2)}
        </Button>
      </div>
    </>
  );
}

// ── Cart line row ──────────────────────────────────────────────────────────

function CartLineRow({
  line, onChangeQty, onSetDiscount, onRemove,
}: {
  line: DraftLine;
  onChangeQty: (q: number) => void;
  onSetDiscount: (d: DiscountInput | null) => void;
  onRemove: () => void;
}) {
  const lineGross = line.unitPrice * line.quantity;
  const lineNet = lineGross - line.discount;

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border/50 bg-card hover:border-border transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{line.description}</p>
          {line.kind === 'product' && <Badge variant="outline" className="text-[10px] px-1 py-0">Retail</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          <Input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => onChangeQty(Math.max(1, Number(e.target.value) || 1))}
            className="h-7 w-14 text-xs"
          />
          <span>× ${line.unitPrice.toFixed(2)}</span>
          <DiscountPopover discount={line.discountInput} onChange={onSetDiscount} />
          {line.discount > 0 && (
            <span className="text-rose-600 dark:text-rose-400">−${line.discount.toFixed(2)}</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-medium text-sm">${lineNet.toFixed(2)}</div>
        {line.discount > 0 && (
          <div className="text-[10px] text-muted-foreground line-through">${lineGross.toFixed(2)}</div>
        )}
      </div>
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground p-1" aria-label="Remove">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Discount popover ───────────────────────────────────────────────────────

function DiscountPopover({ discount, onChange }: { discount: DiscountInput | null; onChange: (d: DiscountInput | null) => void }) {
  const [pct, setPct] = useState<string>('');
  const [amt, setAmt] = useState<string>('');
  const active = discount != null;

  return (
    <Popover>
      <PopoverTrigger className={`flex items-center gap-1 text-xs hover:underline ${active ? 'text-primary' : 'text-muted-foreground'}`}>
        <Percent className="h-3 w-3" />
        {active
          ? discount.kind === 'free'
            ? 'Free'
            : discount.kind === 'percent'
              ? `${discount.value}% off`
              : `$${discount.value} off`
          : 'Discount'}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-2" align="start">
        <div className="text-xs font-medium">Apply discount</div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="%"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            className="h-8"
          />
          <Button size="sm" variant="outline" onClick={() => {
            const v = Number(pct); if (!Number.isFinite(v) || v <= 0) return;
            onChange({ kind: 'percent', value: v }); setPct('');
          }}>%</Button>
        </div>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="$"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            className="h-8"
          />
          <Button size="sm" variant="outline" onClick={() => {
            const v = Number(amt); if (!Number.isFinite(v) || v <= 0) return;
            onChange({ kind: 'amount', value: v }); setAmt('');
          }}>$</Button>
        </div>
        <div className="flex gap-1 pt-1">
          <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => onChange({ kind: 'free', value: 0 })}>
            <Gift className="h-3 w-3 mr-1" /> Free
          </Button>
          {active && (
            <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Tip row ────────────────────────────────────────────────────────────────

function TipRow({ taxableSubtotal, tip, onChange }: { taxableSubtotal: number; tip: number; onChange: (n: number) => void }) {
  const presets = useMemo(() => suggestedTips(taxableSubtotal), [taxableSubtotal]);
  const [custom, setCustom] = useState<string>('');

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1.5">
        {presets.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant={Math.abs(tip - p.amount) < 0.01 ? 'default' : 'outline'}
            onClick={() => onChange(p.amount)}
            className="text-xs"
          >
            {p.label}
            <span className="ml-1 opacity-70">${p.amount.toFixed(0)}</span>
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Custom"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="h-8 text-xs"
        />
        <Button size="sm" variant="outline" onClick={() => {
          const v = Number(custom); if (!Number.isFinite(v) || v < 0) return;
          onChange(v); setCustom('');
        }}>Set</Button>
        {tip > 0 && (
          <Button size="sm" variant="ghost" onClick={() => onChange(0)}>Clear</Button>
        )}
      </div>
    </div>
  );
}

// ── Add product button ────────────────────────────────────────────────────

function AddProductButton({ products, onPick }: { products: { id: string; name: string; price: number; stockLevel: number }[]; onPick: (id: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger className="flex items-center gap-1 text-xs text-primary hover:underline">
        <Plus className="h-3 w-3" /> Add product
      </PopoverTrigger>
      <PopoverContent className="w-64 max-h-72 overflow-y-auto p-1" align="end">
        {products.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3 text-center">No products available.</p>
        ) : (
          products.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              disabled={p.stockLevel <= 0}
              className="w-full flex items-center justify-between gap-2 p-2 text-left text-sm hover:bg-muted rounded-md disabled:opacity-50"
            >
              <span className="truncate">{p.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">${p.price}</span>
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Payment panel ─────────────────────────────────────────────────────────

function PaymentPanel({
  totals, alreadyPaid, savedCards, onCharge, onSaveCard, onBack,
}: {
  totals: { total: number };
  alreadyPaid: number;
  savedCards: SavedCard[];
  onCharge: (method: PaymentMethod, amount: number, reference?: string) => void;
  onSaveCard: (card: Omit<SavedCard, 'id'>) => void;
  onBack: () => void;
}) {
  const remaining = Math.max(0, totals.total - alreadyPaid);
  const [splitAmt, setSplitAmt] = useState<string>('');
  const [newCardLast4, setNewCardLast4] = useState<string>('');
  const [saveForLater, setSaveForLater] = useState(true);

  const charge = (method: PaymentMethod, ref?: string) => {
    const amt = splitAmt ? Number(splitAmt) : remaining;
    if (!Number.isFinite(amt) || amt <= 0) return toast.error('Enter a valid amount');
    if (amt > remaining + 0.01) return toast.error('Amount exceeds remaining balance');
    onCharge(method, amt, ref);
    setSplitAmt('');
  };

  const chargeNewCard = () => {
    if (!/^\d{4}$/.test(newCardLast4)) return toast.error('Enter last 4 digits of the card');
    if (saveForLater) {
      onSaveCard({ brand: 'visa', last4: newCardLast4, expMonth: 12, expYear: new Date().getFullYear() + 3 });
    }
    charge('card', `**** ${newCardLast4}`);
    setNewCardLast4('');
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
          <div className="text-xs text-muted-foreground">Amount due</div>
          <div className="text-3xl font-bold mt-0.5">${remaining.toFixed(2)}</div>
          {alreadyPaid > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              ${alreadyPaid.toFixed(2)} already paid · ${totals.total.toFixed(2)} total
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Split amount (optional)</label>
          <Input
            type="number"
            placeholder={`${remaining.toFixed(2)}`}
            value={splitAmt}
            onChange={(e) => setSplitAmt(e.target.value)}
          />
        </div>

        {savedCards.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cards on file</h4>
            <div className="space-y-1.5">
              {savedCards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => charge('card', `**** ${c.last4}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 transition"
                >
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-sm flex-1 text-left capitalize">{c.brand} •••• {c.last4}</span>
                  <span className="text-xs text-muted-foreground">{String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other methods</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => charge('cash')}>
              <DollarSign className="h-4 w-4 mr-1.5" /> Cash
            </Button>
            <Button variant="outline" onClick={() => {
              const code = prompt('Gift card code'); if (code) charge('gift_card', code);
            }}>
              <Gift className="h-4 w-4 mr-1.5" /> Gift card
            </Button>
          </div>
        </section>

        <section className="space-y-2 rounded-2xl border border-border/60 bg-card p-3">
          <h4 className="text-xs font-semibold">New card</h4>
          <p className="text-[11px] text-muted-foreground">
            Demo mode — production uses Stripe Elements. Enter a fake last-4.
          </p>
          <div className="flex items-center gap-2">
            <Input
              maxLength={4}
              placeholder="0000"
              value={newCardLast4}
              onChange={(e) => setNewCardLast4(e.target.value.replace(/\D/g, ''))}
              className="font-mono"
            />
            <Button size="sm" onClick={chargeNewCard}>
              <CreditCard className="h-4 w-4 mr-1.5" /> Charge
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={saveForLater}
              onChange={(e) => setSaveForLater(e.target.checked)}
              className="size-3.5"
            />
            Save card on file for next time
          </label>
        </section>
      </div>

      <div className="px-6 py-4 border-t bg-background flex gap-2">
        <Button variant="ghost" onClick={onBack}>Back to cart</Button>
      </div>
    </>
  );
}

// ── Receipt view ──────────────────────────────────────────────────────────

function ReceiptView({
  receipt, clientName, clientEmail, clientPhone, onClose,
}: {
  receipt: Receipt;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  onClose: () => void;
}) {
  const send = (channel: 'email' | 'sms') => {
    const target = channel === 'email' ? clientEmail : clientPhone;
    toast.success(`Receipt ${channel === 'email' ? 'emailed' : 'texted'} to ${target ?? 'client'} (mock)`);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-semibold">Paid in full</div>
            <div className="text-xs text-muted-foreground">{receipt.id}</div>
          </div>
          <div className="ml-auto text-2xl font-bold">${receipt.total.toFixed(2)}</div>
        </div>

        <section className="space-y-1.5 text-sm">
          {receipt.items.map((i, idx) => (
            <div key={idx} className="flex justify-between gap-4">
              <span className="flex-1 truncate">
                {i.description}
                {i.quantity > 1 && <span className="text-muted-foreground"> × {i.quantity}</span>}
              </span>
              <span className="tabular-nums">${(i.unitPrice * i.quantity - i.discount).toFixed(2)}</span>
            </div>
          ))}
        </section>

        <Separator />

        <section className="space-y-1 text-sm">
          <Row label="Subtotal" value={receipt.subtotal} />
          {receipt.discountTotal > 0 && <Row label="Discounts" value={-receipt.discountTotal} muted />}
          <Row label="Tax" value={receipt.tax} muted />
          {receipt.tip > 0 && <Row label="Tip" value={receipt.tip} muted />}
          <div className="flex justify-between pt-1 font-semibold">
            <span>Total</span><span>${receipt.total.toFixed(2)}</span>
          </div>
        </section>

        <Separator />

        <section className="space-y-1 text-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</h4>
          {receipt.payments.map((p, idx) => (
            <div key={idx} className="flex justify-between">
              <span className="capitalize">
                {p.method.replace('_', ' ')}
                {p.reference ? ` · ${p.reference}` : ''}
              </span>
              <span>${p.amount.toFixed(2)}</span>
            </div>
          ))}
        </section>

        <div className="text-xs text-muted-foreground text-center">
          For {clientName} · {format(new Date(receipt.createdAt), 'MMM d, yyyy h:mm a')}
        </div>
      </div>

      <div className="px-6 py-4 border-t bg-background grid grid-cols-3 gap-2">
        <Button variant="outline" onClick={() => send('email')} disabled={!clientEmail}>
          <Mail className="h-4 w-4 mr-1.5" /> Email
        </Button>
        <Button variant="outline" onClick={() => send('sms')} disabled={!clientPhone}>
          <Send className="h-4 w-4 mr-1.5" /> Text
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" /> Print
        </Button>
      </div>
      <div className="px-6 pb-4">
        <Button className="w-full" onClick={onClose}>
          <Sparkles className="h-4 w-4 mr-1.5" /> Done
        </Button>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-muted-foreground' : ''}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}</span>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Re-export the icon used by the AppointmentDetailSheet button label.
export { ReceiptIcon };
