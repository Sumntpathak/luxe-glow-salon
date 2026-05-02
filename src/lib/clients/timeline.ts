import { Booking, Service, Staff, PointsHistory } from '@/types';

// ── Client timeline event aggregator ───────────────────────────────────────
// Merges multiple data sources into a single chronological feed for MGN-502.
// Each source produces TimelineEvents that share the same shape so the UI
// can render them uniformly.

export type TimelineEventKind = 'appointment' | 'sale' | 'note' | 'comm' | 'points';

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  /** ISO date or YYYY-MM-DD; sortable as string. */
  at: string;
  title: string;
  subtitle?: string;
  /** Status-bearing events (e.g. appointment) carry their status for color coding. */
  status?: string;
  /** Reference back to the source record so click-to-detail works. */
  refId: string;
  /** Currency amount when relevant (sale, points). */
  amount?: number;
}

export interface BuildTimelineInput {
  clientId: string;
  bookings: Booking[];
  services: Service[];
  staff: Staff[];
  pointsHistory: PointsHistory[];
}

export function buildClientTimeline(input: BuildTimelineInput): TimelineEvent[] {
  const { clientId, bookings, services, staff, pointsHistory } = input;
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const staffMap = new Map(staff.map((s) => [s.id, s]));
  const events: TimelineEvent[] = [];

  // ── Appointments → 'appointment' events (one per booking) ─────────────
  for (const b of bookings) {
    if (b.clientId !== clientId) continue;
    const svc = serviceMap.get(b.serviceId);
    const st = staffMap.get(b.staffId);
    events.push({
      id: `appt-${b.id}`,
      kind: 'appointment',
      at: `${b.date}T${b.time}`,
      title: svc?.name ?? 'Service',
      subtitle: st ? `with ${st.name}` : undefined,
      status: b.status,
      refId: b.id,
      amount: svc?.price,
    });
  }

  // ── Completed bookings also produce 'sale' events (revenue feed) ──────
  for (const b of bookings) {
    if (b.clientId !== clientId || b.status !== 'completed') continue;
    const svc = serviceMap.get(b.serviceId);
    if (!svc) continue;
    events.push({
      id: `sale-${b.id}`,
      kind: 'sale',
      at: `${b.date}T${b.endTime}`,
      title: `Paid ${svc.name}`,
      subtitle: `$${svc.price.toFixed(2)}`,
      refId: b.id,
      amount: svc.price,
    });
  }

  // ── Notes from booking.notes / privateNotes ───────────────────────────
  for (const b of bookings) {
    if (b.clientId !== clientId) continue;
    if (b.notes && b.notes.trim()) {
      events.push({
        id: `note-${b.id}-public`,
        kind: 'note',
        at: `${b.date}T${b.time}`,
        title: 'Note added',
        subtitle: b.notes.length > 80 ? `${b.notes.slice(0, 80)}…` : b.notes,
        refId: b.id,
      });
    }
    if (b.privateNotes && b.privateNotes.trim()) {
      events.push({
        id: `note-${b.id}-private`,
        kind: 'note',
        at: `${b.date}T${b.time}`,
        title: 'Internal note',
        subtitle: b.privateNotes.length > 80 ? `${b.privateNotes.slice(0, 80)}…` : b.privateNotes,
        refId: b.id,
      });
    }
  }

  // ── Loyalty points → 'points' events ──────────────────────────────────
  for (const p of pointsHistory) {
    if (p.clientId !== clientId) continue;
    events.push({
      id: `pts-${p.id}`,
      kind: 'points',
      at: p.date,
      title: p.points >= 0 ? `Earned ${p.points} points` : `Redeemed ${Math.abs(p.points)} points`,
      subtitle: p.reason,
      refId: p.id,
      amount: p.points,
    });
  }

  // Sort reverse-chronological.
  events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return events;
}

/** Filter the feed by event kind(s). 'all' (or empty) returns everything. */
export function filterTimeline(
  events: TimelineEvent[],
  kinds: TimelineEventKind[] | 'all',
): TimelineEvent[] {
  if (kinds === 'all' || kinds.length === 0) return events;
  const set = new Set(kinds);
  return events.filter((e) => set.has(e.kind));
}
