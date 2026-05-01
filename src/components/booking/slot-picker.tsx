import { useEffect, useMemo, useRef, useState } from 'react';
import { format, addDays, isSameDay, isToday as dfIsToday, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  availableStartSlots,
  tryScheduleAt,
  cartDuration,
  busyBookingsOnDate,
  type CartItem,
  type ResolvedItem,
} from '@/lib/booking/availability';
import { timeToMinutes } from '@/lib/calendar/utils';
import type { Booking, Service, Staff } from '@/types';

const STRIP_DAYS = 14;

export interface SlotPickerProps {
  cart: CartItem[];
  services: Service[];
  staff: Staff[];
  bookings: Booking[];
  selectedDate: Date | null;
  selectedTime: string | null;
  onSelect: (date: Date, time: string) => void;
  /** When picking 'any' staff, bias toward this staff (e.g. last-visit stylist). */
  preferStaffId?: string;
  /** Today's date (overridable for testing). Defaults to new Date(). */
  today?: Date;
}

function formatDuration(mins: number): string {
  if (mins <= 0) return '0 min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export default function SlotPicker(props: SlotPickerProps) {
  const { cart, services, staff, bookings, selectedDate, selectedTime, onSelect, preferStaffId, today } = props;
  const todayDate = useMemo(() => startOfDay(today ?? new Date()), [today]);
  const stripDays = useMemo(
    () => Array.from({ length: STRIP_DAYS }, (_, i) => addDays(todayDate, i)),
    [todayDate],
  );

  // Per-day slot lists, memoized on cart/prefer/bookings/services/staff/stripDays.
  const slotsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of stripDays) {
      const key = format(d, 'yyyy-MM-dd');
      map.set(key, availableStartSlots(cart, key, services, staff, bookings, preferStaffId));
    }
    return map;
  }, [cart, preferStaffId, bookings, services, staff, stripDays]);

  const slotsForSelected = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return slotsByDate.get(key) ?? availableStartSlots(cart, key, services, staff, bookings, preferStaffId);
  }, [selectedDate, slotsByDate, cart, services, staff, bookings, preferStaffId]);

  const totalDuration = useMemo(() => cartDuration(cart, services), [cart, services]);

  const resolved: ResolvedItem[] | null = useMemo(() => {
    if (!selectedDate || !selectedTime || cart.length === 0) return null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tryScheduleAt(
      cart, timeToMinutes(selectedTime), dateKey, services, staff,
      busyBookingsOnDate(bookings, dateKey), preferStaffId,
    );
  }, [selectedDate, selectedTime, cart, services, staff, bookings, preferStaffId]);

  const nextDateWithSlots = useMemo(() => {
    for (const d of stripDays) {
      if ((slotsByDate.get(format(d, 'yyyy-MM-dd'))?.length ?? 0) > 0) return d;
    }
    return null;
  }, [stripDays, slotsByDate]);

  // One-shot auto-select when cart goes 0 -> non-empty and nothing is chosen.
  const prevCartLen = useRef(cart.length);
  useEffect(() => {
    const wasEmpty = prevCartLen.current === 0;
    prevCartLen.current = cart.length;
    if (!wasEmpty || cart.length === 0) return;
    if (selectedDate && selectedTime) return;
    if (!nextDateWithSlots) return;
    const first = slotsByDate.get(format(nextDateWithSlots, 'yyyy-MM-dd'))?.[0];
    if (first) onSelect(nextDateWithSlots, first);
  }, [cart.length, selectedDate, selectedTime, nextDateWithSlots, slotsByDate, onSelect]);

  // Auto-scroll the selected time pill into view.
  const gridRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!selectedTime || !gridRef.current) return;
    const el = gridRef.current.querySelector<HTMLButtonElement>(`[data-time="${selectedTime}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedTime, slotsForSelected]);

  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const handleDayPick = (d: Date): void => {
    const first = slotsByDate.get(format(d, 'yyyy-MM-dd'))?.[0] ?? null;
    if (first) onSelect(d, first);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section 1: 14-day mini date strip + jump-to-date popover */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground/80">Choose a day</h3>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger
              render={
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-primary">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Pick another date
                </Button>
              }
            />
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate ?? undefined}
                onSelect={(d) => { if (!d) return; setDatePopoverOpen(false); handleDayPick(d); }}
                disabled={{ before: todayDate }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" role="listbox" aria-label="Available days">
          {stripDays.map((d) => {
            const key = format(d, 'yyyy-MM-dd');
            const count = slotsByDate.get(key)?.length ?? 0;
            const disabled = cart.length > 0 && count === 0;
            const active = selectedDate !== null && isSameDay(selectedDate, d);
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                disabled={disabled}
                onClick={() => handleDayPick(d)}
                className={cn(
                  'relative flex min-w-[3.5rem] shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-2 transition-colors',
                  active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-muted/40 hover:bg-muted',
                  disabled && 'cursor-not-allowed opacity-40 hover:bg-muted/40',
                )}
              >
                <span className={cn('text-[0.65rem] font-semibold uppercase tracking-wider', active ? 'opacity-90' : 'text-muted-foreground')}>
                  {format(d, 'EEE')}
                </span>
                <span className="mt-0.5 text-base font-bold leading-none">{format(d, 'd')}</span>
                {dfIsToday(d) && (
                  <span className={cn('absolute bottom-1 h-1 w-1 rounded-full', active ? 'bg-primary-foreground' : 'bg-primary')} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Time slot grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Available times</span>
          {totalDuration > 0 && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">{formatDuration(totalDuration)} total</span>
            </>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            Pick services first to see available times.
          </div>
        ) : !selectedDate || slotsForSelected.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            <span>No openings this day. Try another date.</span>
            {nextDateWithSlots &&
              (!selectedDate || !isSameDay(nextDateWithSlots, selectedDate)) && (
                <Button size="sm" variant="outline" onClick={() => handleDayPick(nextDateWithSlots)}>
                  Jump to {format(nextDateWithSlots, 'EEE, MMM d')}
                </Button>
              )}
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4"
          >
            {slotsForSelected.map((time) => {
              const active = time === selectedTime;
              return (
                <button
                  key={time}
                  type="button"
                  data-time={time}
                  onClick={() => onSelect(selectedDate, time)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background hover:border-primary hover:text-primary',
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Resolved schedule preview */}
      {resolved && resolved.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/80">
            Your schedule
          </h4>
          <ul className="flex flex-col gap-2">
            {resolved.map((item) => {
              const cartItem = cart.find((c) => c.id === item.id);
              const wasAuto = cartItem?.staffPreference === 'any' || cartItem?.staffPreference !== item.resolvedStaffId;
              const staffName = staff.find((s) => s.id === item.resolvedStaffId)?.name ?? 'Stylist';
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-background/60 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{item.service.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{item.startTime} – {item.endTime}</span>
                      <span className="opacity-60">·</span>
                      <span className="flex items-center gap-1">
                        with {staffName}
                        {wasAuto && <Sparkles className="h-3 w-3 text-primary" aria-label="Auto-picked" />}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
