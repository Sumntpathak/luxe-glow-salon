import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { timeToMinutes } from '@/lib/calendar/utils';

// ── MGN-404: Service-flow auto-progression ─────────────────────────────────
// Tick once per minute. For each booking on today's date:
//   - confirmed → flag "Late" (no auto-advance) if start time is 5+ min past
//                 and no checked_in transition has happened.
//   - checked_in → auto-advance to in_service when start time has passed.
//   - in_service → emit a one-shot toast prompting "Mark complete?" once the
//                   end time has passed. Doesn't force the transition; staff
//                   confirms via the toast action.
// Anything not already in confirmed/checked_in/in_service is ignored.

const TICK_MS = 60_000;            // 60s
const LATE_THRESHOLD_MIN = 5;
const LATE_TOAST_KEY = (id: string) => `late:${id}`;
const COMPLETE_TOAST_KEY = (id: string) => `complete:${id}`;

export function useAutoProgression(): void {
  const lateNotified = useRef<Set<string>>(new Set());
  const completeNotified = useRef<Set<string>>(new Set());

  useEffect(() => {
    const tick = () => {
      const state = useStore.getState();
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const nowMin = now.getHours() * 60 + now.getMinutes();

      for (const b of state.bookings) {
        if (b.date !== todayStr) continue;
        const startMin = timeToMinutes(b.time);
        const endMin = timeToMinutes(b.endTime);

        // confirmed past start time + LATE_THRESHOLD → flag (one-shot toast).
        if (b.status === 'confirmed' && nowMin >= startMin + LATE_THRESHOLD_MIN) {
          if (!lateNotified.current.has(b.id)) {
            lateNotified.current.add(b.id);
            toast(`Running late: ${b.time} appointment hasn't checked in.`, {
              id: LATE_TOAST_KEY(b.id),
              icon: '⏱️',
              duration: 6000,
            });
          }
        }

        // checked_in past start → auto-advance to in_service.
        if (b.status === 'checked_in' && nowMin >= startMin) {
          state.updateBooking(b.id, { status: 'in_service' });
        }

        // in_service past end → one-shot prompt to mark complete.
        if (b.status === 'in_service' && nowMin >= endMin) {
          if (!completeNotified.current.has(b.id)) {
            completeNotified.current.add(b.id);
            toast(`Service done at ${b.endTime}? Mark complete from the calendar.`, {
              id: COMPLETE_TOAST_KEY(b.id),
              icon: '✅',
              duration: 8000,
            });
          }
        }
      }
    };

    tick(); // run immediately on mount
    const handle = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(handle);
  }, []);
}
