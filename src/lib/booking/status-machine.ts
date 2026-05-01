import { BookingStatus } from '@/types';

// ── Booking status state machine ────────────────────────────────────────────
// Mirrors Mangomint's appointment lifecycle. Front desk taps "Check In" once;
// the rest progresses via auto-progression (MGN-404) or one-tap admin actions.

/** Allowed transitions for one-tap status changes. */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_service', 'cancelled'],
  in_service: ['completed', 'cancelled'],
  completed:  [],            // terminal
  cancelled:  [],            // terminal
  no_show:    [],            // terminal
};

export interface StatusMeta {
  label: string;
  /** Short verb for the action button ("Check in", "Start service"). */
  actionLabel?: string;
  /** Action button intent for shadcn variant or color hint. */
  intent?: 'primary' | 'destructive' | 'outline' | 'ghost';
}

export const STATUS_META: Record<BookingStatus, StatusMeta> = {
  pending:    { label: 'Pending',    actionLabel: 'Confirm',         intent: 'primary' },
  confirmed:  { label: 'Confirmed',  actionLabel: 'Check in',        intent: 'primary' },
  checked_in: { label: 'Checked in', actionLabel: 'Start service',   intent: 'primary' },
  in_service: { label: 'In service', actionLabel: 'Mark complete',   intent: 'primary' },
  completed:  { label: 'Completed' },
  cancelled:  { label: 'Cancelled' },
  no_show:    { label: 'No-show' },
};

/** True if the booking is in a "final" state. */
export function isTerminal(s: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[s].length === 0;
}

/** The next default status in the linear path (or null if terminal/branching). */
export function defaultNextStatus(s: BookingStatus): BookingStatus | null {
  const linear: Partial<Record<BookingStatus, BookingStatus>> = {
    pending: 'confirmed',
    confirmed: 'checked_in',
    checked_in: 'in_service',
    in_service: 'completed',
  };
  return linear[s] ?? null;
}
