import { ReceiptLineItem } from '@/types';

// ── Pure math for the checkout cart ────────────────────────────────────────

export type DiscountKind = 'percent' | 'amount' | 'free';

export interface DiscountInput {
  kind: DiscountKind;
  /** For 'percent': 0-100. For 'amount': dollars. For 'free': ignored. */
  value: number;
}

/** Apply a discount to a single line, returning the discount in dollars (clamped). */
export function applyLineDiscount(unitPrice: number, qty: number, d: DiscountInput | null): number {
  if (!d) return 0;
  const gross = unitPrice * qty;
  if (d.kind === 'free') return gross;
  if (d.kind === 'percent') return Math.min(gross, gross * (d.value / 100));
  return Math.min(gross, d.value);
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxableSubtotal: number;
  tax: number;
  tip: number;
  total: number;
}

/** Computes the full breakdown for the cart. Tax is applied after line discounts. */
export function computeTotals(
  items: ReceiptLineItem[],
  taxRate: number,
  tip: number,
): CartTotals {
  let subtotal = 0;
  let discountTotal = 0;
  for (const i of items) {
    const gross = i.unitPrice * i.quantity;
    subtotal += gross;
    discountTotal += i.discount;
  }
  const taxableSubtotal = Math.max(0, subtotal - discountTotal);
  const tax = round2(taxableSubtotal * taxRate);
  const total = round2(taxableSubtotal + tax + tip);
  return {
    subtotal: round2(subtotal),
    discountTotal: round2(discountTotal),
    taxableSubtotal: round2(taxableSubtotal),
    tax,
    tip: round2(tip),
    total,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Common tip suggestions. Returns dollar amounts based on the pre-tax subtotal. */
export function suggestedTips(taxableSubtotal: number): Array<{ label: string; amount: number; pct: number }> {
  const pcts = [0.15, 0.18, 0.20, 0.25];
  return pcts.map((pct) => ({
    label: `${Math.round(pct * 100)}%`,
    amount: round2(taxableSubtotal * pct),
    pct,
  }));
}
