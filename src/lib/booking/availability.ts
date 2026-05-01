import { Booking, Service, Staff } from '@/types';
import { timeToMinutes, minutesToTime } from '@/lib/calendar/utils';

// ── Cart item shape (no DB row yet — pre-confirm UX state) ─────────────────
export interface CartItem {
  /** Stable client-side id used for list keys + reorder. */
  id: string;
  serviceId: string;
  /** 'any' = auto-pick least-busy qualified staff at slot resolution. */
  staffPreference: string | 'any';
}

export interface ResolvedItem extends CartItem {
  /** Resolved staff after slot pick (always concrete). */
  resolvedStaffId: string;
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  service: Service;
}

// ── Business hours (mirrors calendar utils) ────────────────────────────────
const BUSINESS_OPEN_MIN = 9 * 60;   // 09:00
const BUSINESS_CLOSE_MIN = 19 * 60; // 19:00 (last possible end time)
const SLOT_GRANULARITY = 15;        // 15-min increments for the slot strip

// ── Helpers ────────────────────────────────────────────────────────────────

/** Existing bookings on a given date that block scheduling. */
export function busyBookingsOnDate(bookings: Booking[], date: string): Booking[] {
  return bookings.filter(
    (b) => b.date === date && b.status !== 'cancelled',
  );
}

/** Is `staffId` free for the [start, start+duration) window on `date`? */
export function isStaffFree(
  staffId: string,
  date: string,
  startMin: number,
  durationMin: number,
  busy: Booking[],
): boolean {
  const endMin = startMin + durationMin;
  return !busy.some((b) => {
    if (b.staffId !== staffId) return false;
    const bs = timeToMinutes(b.time);
    const be = timeToMinutes(b.endTime);
    return startMin < be && endMin > bs;
  });
}

/**
 * Try to schedule a cart sequentially starting at `startMin`. For each item:
 *  - If `staffPreference === 'any'`, find the first eligible & free staff.
 *  - If a specific staff is preferred, require they be free at that step.
 * Returns the resolved schedule, or null if any item can't fit.
 */
export function tryScheduleAt(
  cart: CartItem[],
  startMin: number,
  date: string,
  services: Service[],
  staff: Staff[],
  busy: Booking[],
  /** Optional bias: prefer this staff when tied (e.g., client's last-visit stylist). */
  preferStaffId?: string,
): ResolvedItem[] | null {
  // Track staff allocations made earlier in this same cart so a staffer
  // can't double-book themselves across two cart items at the same time.
  const localBusy: Booking[] = [...busy];

  let cursor = startMin;
  const out: ResolvedItem[] = [];

  for (const item of cart) {
    const svc = services.find((s) => s.id === item.serviceId);
    if (!svc) return null;
    const dur = svc.duration;
    const slotEnd = cursor + dur;
    if (slotEnd > BUSINESS_CLOSE_MIN) return null;

    const eligible = staff.filter(
      (s) => s.isActive && svc.assignableStaff.includes(s.id),
    );
    if (eligible.length === 0) return null;

    let pick: Staff | null = null;
    if (item.staffPreference !== 'any') {
      const target = eligible.find((s) => s.id === item.staffPreference);
      if (target && isStaffFree(target.id, date, cursor, dur, localBusy)) pick = target;
      else return null;
    } else {
      // "Any available" — prefer biased staff, then first eligible free.
      if (preferStaffId) {
        const biased = eligible.find((s) => s.id === preferStaffId);
        if (biased && isStaffFree(biased.id, date, cursor, dur, localBusy)) pick = biased;
      }
      if (!pick) {
        pick = eligible.find((s) => isStaffFree(s.id, date, cursor, dur, localBusy)) ?? null;
      }
    }
    if (!pick) return null;

    const startTime = minutesToTime(cursor);
    const endTime = minutesToTime(slotEnd);
    out.push({
      ...item,
      resolvedStaffId: pick.id,
      startTime,
      endTime,
      service: svc,
    });
    // Reserve this allocation for subsequent items in the cart.
    localBusy.push({
      id: '__cart-reservation__',
      orgId: '', locationId: '', clientId: '', notes: '', createdAt: '',
      serviceId: svc.id,
      staffId: pick.id,
      date,
      time: startTime,
      endTime,
      status: 'confirmed',
    });
    cursor = slotEnd;
  }

  return out;
}

/**
 * Returns all start-time slots on `date` where the entire cart can be scheduled.
 * Slots are HH:mm strings at 15-min granularity within business hours.
 */
export function availableStartSlots(
  cart: CartItem[],
  date: string,
  services: Service[],
  staff: Staff[],
  bookings: Booking[],
  preferStaffId?: string,
): string[] {
  if (cart.length === 0) return [];
  const busy = busyBookingsOnDate(bookings, date);
  const totalDuration = cart.reduce((sum, i) => {
    const s = services.find((sv) => sv.id === i.serviceId);
    return sum + (s?.duration ?? 0);
  }, 0);
  if (totalDuration === 0) return [];

  const out: string[] = [];
  for (let m = BUSINESS_OPEN_MIN; m + totalDuration <= BUSINESS_CLOSE_MIN; m += SLOT_GRANULARITY) {
    const ok = tryScheduleAt(cart, m, date, services, staff, busy, preferStaffId);
    if (ok) out.push(minutesToTime(m));
  }
  return out;
}

/** Total cart duration in minutes. */
export function cartDuration(cart: CartItem[], services: Service[]): number {
  return cart.reduce((sum, i) => {
    const s = services.find((sv) => sv.id === i.serviceId);
    return sum + (s?.duration ?? 0);
  }, 0);
}

/** Total cart price. */
export function cartPrice(cart: CartItem[], services: Service[]): number {
  return cart.reduce((sum, i) => {
    const s = services.find((sv) => sv.id === i.serviceId);
    return sum + (s?.price ?? 0);
  }, 0);
}
