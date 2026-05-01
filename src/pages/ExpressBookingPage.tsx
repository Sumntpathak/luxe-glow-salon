import { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Service, Booking } from '@/types';
import { useStore } from '@/lib/store';
import {
  useTenantBookings, useTenantServices, useTenantStaff,
} from '@/lib/store/hooks';
import {
  CartItem, tryScheduleAt, cartDuration, cartPrice, busyBookingsOnDate,
} from '@/lib/booking/availability';
import { timeToMinutes } from '@/lib/calendar/utils';
import { ServiceCatalog, BookingCart } from '@/components/booking';
import SlotPicker from '@/components/booking/slot-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ShoppingBag, Clock, ChevronUp } from 'lucide-react';

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

function uid(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ExpressBookingPage() {
  const navigate = useNavigate();
  const services = useTenantServices('org').filter((s) => s.isActive);
  const staff = useTenantStaff('org').filter((s) => s.isActive);
  const allBookings = useTenantBookings('org');
  const currentUser = useStore((s) => s.currentUser);
  const addBookingGroup = useStore((s) => s.addBookingGroup);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Guest fields (when no logged-in client)
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const isGuest = !currentUser || currentUser.role !== 'consumer';
  const totalDuration = cartDuration(cart, services);
  const totalPrice = cartPrice(cart, services);
  const selectedServiceIds = useMemo(() => cart.map((c) => c.serviceId), [cart]);

  const handleAddService = useCallback((s: Service) => {
    setCart((prev) => [...prev, { id: uid(), serviceId: s.id, staffPreference: 'any' }]);
    setSelectedTime(null); // re-pick a slot since duration changed
  }, []);

  const handleChangeStaff = useCallback((cartItemId: string, staffPref: string | 'any') => {
    setCart((prev) => prev.map((c) => (c.id === cartItemId ? { ...c, staffPreference: staffPref } : c)));
    setSelectedTime(null);
  }, []);

  const handleRemove = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== cartItemId));
    setSelectedTime(null);
  }, []);

  const handleReorder = useCallback((newOrder: string[]) => {
    setCart((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      return newOrder.map((id) => map.get(id)!).filter(Boolean);
    });
    setSelectedTime(null);
  }, []);

  const handleSelectSlot = useCallback((d: Date, t: string) => {
    setSelectedDate(d);
    setSelectedTime(t);
  }, []);

  const canConfirm = (() => {
    if (cart.length === 0 || !selectedDate || !selectedTime) return false;
    if (isGuest && (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim())) return false;
    return true;
  })();

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const busy = busyBookingsOnDate(allBookings, dateStr);
    const resolved = tryScheduleAt(
      cart, timeToMinutes(selectedTime), dateStr, services, staff, busy,
    );
    if (!resolved) {
      toast.error('That slot is no longer available — please pick another time.');
      setSelectedTime(null);
      return;
    }

    const clientId = isGuest ? `guest-${Date.now()}` : currentUser!.id;
    const guestNote = isGuest
      ? `Guest: ${guestName.trim()} (${guestEmail.trim()}, ${guestPhone.trim()}). `
      : '';

    addBookingGroup(
      resolved.map((r): Omit<Booking, 'orgId' | 'locationId' | 'groupId'> => ({
        id: `bk-${Date.now()}-${r.id.slice(-4)}`,
        clientId,
        staffId: r.resolvedStaffId,
        serviceId: r.serviceId,
        date: dateStr,
        time: r.startTime,
        endTime: r.endTime,
        status: 'confirmed',
        notes: guestNote,
        createdAt: new Date().toISOString(),
      })),
    );

    toast.success(`Booked ${cart.length} service${cart.length > 1 ? 's' : ''} — see you ${format(selectedDate, 'EEE, MMM d')}!`);

    if (isGuest) navigate('/my-bookings');
    else navigate('/consumer/appointments');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">Luxe Glow</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-muted-foreground">Book your visit</span>
            {!currentUser && <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>}
          </div>
        </div>
      </header>

      {/* ── Main 2-col layout ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_400px] gap-6 pb-32 lg:pb-6">
        {/* Left: catalog */}
        <section>
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight">Build your visit</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pick one or more services. We'll find the best slot and stylist combination for you.
            </p>
          </div>
          <ServiceCatalog
            services={services}
            selectedServiceIds={selectedServiceIds}
            onAdd={handleAddService}
          />
        </section>

        {/* Right: cart + slot picker (sticky on lg) */}
        <aside className="hidden lg:block sticky top-20 h-fit space-y-5">
          <BookingCart
            items={cart}
            services={services}
            staff={staff}
            onChangeStaff={handleChangeStaff}
            onRemove={handleRemove}
            onReorder={handleReorder}
          />
          {cart.length > 0 && (
            <SlotPicker
              cart={cart}
              services={services}
              staff={staff}
              bookings={allBookings}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelect={handleSelectSlot}
            />
          )}
          {isGuest && cart.length > 0 && (
            <GuestFields
              name={guestName} setName={setGuestName}
              email={guestEmail} setEmail={setGuestEmail}
              phone={guestPhone} setPhone={setGuestPhone}
            />
          )}
          {cart.length > 0 && (
            <ConfirmCard
              totalDuration={totalDuration}
              totalPrice={totalPrice}
              when={selectedDate && selectedTime ? `${format(selectedDate, 'EEE, MMM d')} · ${selectedTime}` : null}
              canConfirm={canConfirm}
              onConfirm={handleConfirm}
            />
          )}
        </aside>
      </div>

      {/* ── Mobile sticky bottom bar + drawer ──────────────────────────── */}
      <div className="lg:hidden">
        {cart.length > 0 && (
          <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur-sm">
            <div className="px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setMobileCartOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-4 w-4" />
                {cart.length}
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">
                  {selectedDate && selectedTime
                    ? `${format(selectedDate, 'EEE, MMM d')} · ${selectedTime}`
                    : 'Pick a time'}
                </div>
                <div className="font-semibold text-sm truncate">
                  ${totalPrice} · {formatDuration(totalDuration)}
                </div>
              </div>
              <Button
                size="sm"
                disabled={!canConfirm}
                onClick={() => (selectedTime ? handleConfirm() : setMobileCartOpen(true))}
              >
                {selectedTime ? 'Confirm' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {mobileCartOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileCartOpen(false)}
              aria-hidden
            />
            <div className="fixed bottom-0 inset-x-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background border-t border-border shadow-2xl p-4 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Your visit</h2>
                <button onClick={() => setMobileCartOpen(false)} className="text-sm text-muted-foreground">
                  Close
                </button>
              </div>
              <BookingCart
                items={cart}
                services={services}
                staff={staff}
                onChangeStaff={handleChangeStaff}
                onRemove={handleRemove}
                onReorder={handleReorder}
              />
              <SlotPicker
                cart={cart}
                services={services}
                staff={staff}
                bookings={allBookings}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelect={handleSelectSlot}
              />
              {isGuest && (
                <GuestFields
                  name={guestName} setName={setGuestName}
                  email={guestEmail} setEmail={setGuestEmail}
                  phone={guestPhone} setPhone={setGuestPhone}
                />
              )}
              <Button
                className="w-full"
                disabled={!canConfirm}
                onClick={() => { handleConfirm(); setMobileCartOpen(false); }}
              >
                Confirm booking · ${totalPrice}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ConfirmCard({
  totalDuration, totalPrice, when, canConfirm, onConfirm,
}: {
  totalDuration: number; totalPrice: number;
  when: string | null;
  canConfirm: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Total time
        </span>
        <span className="font-medium">{formatDuration(totalDuration)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Total price</span>
        <span className="font-medium">${totalPrice}</span>
      </div>
      {when && (
        <div className="flex justify-between text-sm border-t border-border/50 pt-3">
          <span className="text-muted-foreground">When</span>
          <span className="font-medium">{when}</span>
        </div>
      )}
      <Button
        className="w-full"
        disabled={!canConfirm}
        onClick={onConfirm}
      >
        {when ? 'Confirm booking' : 'Pick a time first'}
      </Button>
    </div>
  );
}

function GuestFields({
  name, setName, email, setEmail, phone, setPhone,
}: {
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void;
  phone: string; setPhone: (s: string) => void;
}) {
  return (
    <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-3">
      <h3 className="font-medium text-sm">Your details</h3>
      <div className="space-y-1.5">
        <Label htmlFor="g-name">Full name</Label>
        <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-email">Email</Label>
        <Input id="g-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@email.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-phone">Phone</Label>
        <Input id="g-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" />
      </div>
    </div>
  );
}
