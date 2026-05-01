import { Booking, BookingStatus } from '@/types';
import { format, parseISO, addMinutes, startOfWeek, addDays, isSameDay } from 'date-fns';

// ── Configuration ──────────────────────────────────────────────────────────
export const CAL_START_HOUR = 8;        // 08:00
export const CAL_END_HOUR = 20;         // 20:00
export const CAL_SLOT_MINUTES = 15;     // 15-min grid resolution
export const CAL_PIXELS_PER_MINUTE = 1.4; // visual density (1.4px / min → 84px / hr)

export const CAL_HEIGHT_PX =
  (CAL_END_HOUR - CAL_START_HOUR) * 60 * CAL_PIXELS_PER_MINUTE;

// ── Status → color tokens (MGN-202) ────────────────────────────────────────
// Tailwind classes for block backgrounds + left-border accents. Cancelled gets
// a diagonal stripe via the .cancelled-stripes utility (defined inline if needed).
export interface StatusStyle {
  bg: string;          // background class
  border: string;      // left-border accent class
  text: string;        // foreground text class
  badge: string;       // small status pill class
  label: string;
}

export const STATUS_STYLES: Record<BookingStatus, StatusStyle> = {
  pending: {
    bg: 'bg-amber-100/80 dark:bg-amber-900/40',
    border: 'border-l-amber-500',
    text: 'text-amber-950 dark:text-amber-100',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    label: 'Pending',
  },
  confirmed: {
    bg: 'bg-blue-100/80 dark:bg-blue-900/40',
    border: 'border-l-blue-500',
    text: 'text-blue-950 dark:text-blue-100',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    label: 'Confirmed',
  },
  checked_in: {
    bg: 'bg-purple-100/80 dark:bg-purple-900/40',
    border: 'border-l-purple-500',
    text: 'text-purple-950 dark:text-purple-100',
    badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
    label: 'Checked in',
  },
  in_service: {
    bg: 'bg-emerald-100/80 dark:bg-emerald-900/40',
    border: 'border-l-emerald-500',
    text: 'text-emerald-950 dark:text-emerald-100',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    label: 'In service',
  },
  completed: {
    bg: 'bg-gray-100 dark:bg-gray-800/60',
    border: 'border-l-gray-400 dark:border-l-gray-500',
    text: 'text-gray-700 dark:text-gray-200',
    badge: 'bg-gray-500/15 text-gray-700 dark:text-gray-300',
    label: 'Completed',
  },
  cancelled: {
    bg: 'bg-red-50 dark:bg-red-950/40 line-through opacity-70',
    border: 'border-l-red-400',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-300',
    label: 'Cancelled',
  },
  no_show: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 opacity-70',
    border: 'border-l-rose-400',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    label: 'No-show',
  },
};

// ── Time math ──────────────────────────────────────────────────────────────

/** Parse "HH:mm" into total minutes from 00:00. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

/** Convert total minutes from 00:00 back to "HH:mm". */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Snap a minute count to the configured slot granularity. */
export function snapToSlot(mins: number): number {
  return Math.round(mins / CAL_SLOT_MINUTES) * CAL_SLOT_MINUTES;
}

/** Vertical pixel offset of a "HH:mm" time, relative to grid top. */
export function timeToPixels(time: string): number {
  const mins = timeToMinutes(time) - CAL_START_HOUR * 60;
  return Math.max(0, mins * CAL_PIXELS_PER_MINUTE);
}

/** Inverse: which "HH:mm" slot does this Y-pixel correspond to? */
export function pixelsToTime(pixels: number): string {
  const mins = snapToSlot(pixels / CAL_PIXELS_PER_MINUTE) + CAL_START_HOUR * 60;
  const clamped = Math.max(CAL_START_HOUR * 60, Math.min(CAL_END_HOUR * 60, mins));
  return minutesToTime(clamped);
}

/** Block height in pixels for a given duration in minutes. */
export function durationToPixels(durationMins: number): number {
  return durationMins * CAL_PIXELS_PER_MINUTE;
}

// ── Grid helpers ───────────────────────────────────────────────────────────

/** Hours rendered on the Y-axis (e.g. ["08:00", "09:00", ... "20:00"]). */
export function hourLabels(): string[] {
  const out: string[] = [];
  for (let h = CAL_START_HOUR; h <= CAL_END_HOUR; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
  }
  return out;
}

/** 7 days of the week containing `date`, starting Monday. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// ── Bookings filtering ─────────────────────────────────────────────────────

export interface BookingFilters {
  staffIds?: string[];
  statuses?: BookingStatus[];
  serviceCategoryIds?: string[];
}

export function applyFilters(bookings: Booking[], f: BookingFilters): Booking[] {
  return bookings.filter((b) => {
    if (f.staffIds?.length && !f.staffIds.includes(b.staffId)) return false;
    if (f.statuses?.length && !f.statuses.includes(b.status)) return false;
    return true;
  });
}

export function bookingsForDate(bookings: Booking[], date: Date): Booking[] {
  const target = format(date, 'yyyy-MM-dd');
  return bookings.filter((b) => b.date === target);
}

export function bookingsForStaffOnDate(
  bookings: Booking[],
  staffId: string,
  date: Date,
): Booking[] {
  return bookingsForDate(bookings, date).filter((b) => b.staffId === staffId);
}

// ── Conflict detection ─────────────────────────────────────────────────────

/** Does proposed booking overlap with any of `existing` for the same staff? */
export function hasConflict(
  existing: Booking[],
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
  ignoreId?: string,
): boolean {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return existing.some((b) => {
    if (ignoreId && b.id === ignoreId) return false;
    if (b.staffId !== staffId || b.date !== date) return false;
    if (b.status === 'cancelled') return false;
    const bs = timeToMinutes(b.time);
    const be = timeToMinutes(b.endTime);
    return startMin < be && endMin > bs;
  });
}

// ── Today queue grouping (MGN-206) ─────────────────────────────────────────

export interface TodayQueueGroups {
  inProgress: Booking[];
  upNext: Booking[];
  waiting: Booking[];
}

export function groupTodayBookings(bookings: Booking[], now: Date = new Date()): TodayQueueGroups {
  const today = bookings.filter((b) => isSameDay(parseISO(b.date), now) && b.status !== 'cancelled');
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const inProgress: Booking[] = [];
  const upNext: Booking[] = [];
  const waiting: Booking[] = [];

  for (const b of today) {
    if (b.status === 'completed') continue;
    const startMin = timeToMinutes(b.time);
    const endMin = timeToMinutes(b.endTime);
    if (startMin <= nowMin && endMin > nowMin) inProgress.push(b);
    else if (startMin > nowMin) upNext.push(b);
    else waiting.push(b); // started but not yet completed = "running late / waiting"
  }

  // Sort each by time
  const byTime = (a: Booking, b: Booking) => a.time.localeCompare(b.time);
  return {
    inProgress: inProgress.sort(byTime),
    upNext: upNext.sort(byTime),
    waiting: waiting.sort(byTime),
  };
}

// ── Misc ───────────────────────────────────────────────────────────────────

/** Combine date + "HH:mm" into a Date at that wall-clock time. */
export function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const out = new Date(date);
  out.setHours(h, m, 0, 0);
  return out;
}

/** Compute end time given a start "HH:mm" + duration in minutes. */
export function addMinutesToTime(start: string, durationMins: number): string {
  const d = combineDateTime(new Date(), start);
  return format(addMinutes(d, durationMins), 'HH:mm');
}
