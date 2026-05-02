import { Booking, Service } from '@/types';
import { parseISO, isAfter } from 'date-fns';

// ── Per-client metrics derived from bookings + services ────────────────────
// All functions are pure and accept the data; safe to call inside useMemo.

export interface ClientMetrics {
  visitCount: number;        // count of completed bookings
  lifetimeValue: number;     // total $ across completed bookings
  lastVisitDate: string | null;
  lastVisitStaffId: string | null;
  upcomingCount: number;     // confirmed/pending in the future
  noShowCount: number;
}

const PRICEABLE_STATUSES = new Set(['completed', 'in_service']);

export function computeClientMetrics(
  clientId: string,
  bookings: Booking[],
  services: Service[],
): ClientMetrics {
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  let visitCount = 0;
  let lifetimeValue = 0;
  let lastVisitDate: string | null = null;
  let lastVisitStaffId: string | null = null;
  let upcomingCount = 0;
  let noShowCount = 0;

  const now = new Date();

  for (const b of bookings) {
    if (b.clientId !== clientId) continue;

    if (PRICEABLE_STATUSES.has(b.status) || b.status === 'completed') {
      const svc = serviceMap.get(b.serviceId);
      if (svc) lifetimeValue += svc.price;
      if (b.status === 'completed') {
        visitCount += 1;
        if (!lastVisitDate || b.date > lastVisitDate) {
          lastVisitDate = b.date;
          lastVisitStaffId = b.staffId;
        }
      }
    }

    if (b.status === 'no_show') noShowCount += 1;

    if ((b.status === 'confirmed' || b.status === 'pending' || b.status === 'checked_in') &&
        isAfter(parseISO(b.date), now)) {
      upcomingCount += 1;
    }
  }

  return { visitCount, lifetimeValue, lastVisitDate, lastVisitStaffId, upcomingCount, noShowCount };
}

/** Cheap aggregator for the list view — single pass per booking. */
export function computeAllClientMetrics(
  clientIds: string[],
  bookings: Booking[],
  services: Service[],
): Map<string, ClientMetrics> {
  const out = new Map<string, ClientMetrics>();
  for (const id of clientIds) {
    out.set(id, computeClientMetrics(id, bookings, services));
  }
  return out;
}

/** Days since last visit (or null if never visited). */
export function daysSinceLastVisit(lastVisitDate: string | null, now: Date = new Date()): number | null {
  if (!lastVisitDate) return null;
  const last = parseISO(lastVisitDate);
  const ms = now.getTime() - last.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
