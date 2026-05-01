import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { Plus } from 'lucide-react';
import { Booking, Service, Staff } from '@/types';
import {
  CAL_END_HOUR, CAL_HEIGHT_PX, CAL_PIXELS_PER_MINUTE, CAL_SLOT_MINUTES, CAL_START_HOUR,
  bookingsForDate, bookingsForStaffOnDate, hourLabels, minutesToTime,
  timeToMinutes, timeToPixels, weekDays,
} from '@/lib/calendar/utils';
import { cn } from '@/lib/utils';
import AppointmentBlock from './appointment-block';

interface CalendarClient { id: string; name: string; avatar?: string }
interface CalendarGridProps {
  date: Date;
  bookings: Booking[];
  staff: Staff[];
  services: Service[];
  clients: CalendarClient[];
  onSelectAppointment: (b: Booking) => void;
  onCreateAt?: (input: { date: string; time: string; staffId?: string }) => void;
}

interface PositionedBooking {
  booking: Booking;
  widthPercent: number;
  leftPercent: number;
}

// Compute side-by-side lanes for overlapping bookings.
function positionBookings(bookings: Booking[]): PositionedBooking[] {
  const sorted = [...bookings].sort((a, b) => a.time.localeCompare(b.time));
  const lanes: number[] = []; // lanes[i] = endMin of last booking in lane i
  const laneOf = new Map<string, number>();
  for (const b of sorted) {
    const startMin = timeToMinutes(b.time);
    const endMin = timeToMinutes(b.endTime);
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] <= startMin) { lanes[i] = endMin; laneOf.set(b.id, i); placed = true; break; }
    }
    if (!placed) { lanes.push(endMin); laneOf.set(b.id, lanes.length - 1); }
  }
  return sorted.map((b) => {
    const startMin = timeToMinutes(b.time);
    const endMin = timeToMinutes(b.endTime);
    const overlap = sorted.filter((o) => timeToMinutes(o.time) < endMin && timeToMinutes(o.endTime) > startMin);
    const totalLanes = Math.max(1, ...overlap.map((o) => (laneOf.get(o.id) ?? 0) + 1));
    const lane = laneOf.get(b.id) ?? 0;
    return { booking: b, widthPercent: 100 / totalLanes, leftPercent: (100 / totalLanes) * lane };
  });
}

function computeTimeFromY(y: number): string {
  const slotPx = CAL_SLOT_MINUTES * CAL_PIXELS_PER_MINUTE;
  const totalSlots = ((CAL_END_HOUR - CAL_START_HOUR) * 60) / CAL_SLOT_MINUTES;
  const slot = Math.max(0, Math.min(totalSlots - 1, Math.floor(y / slotPx)));
  return minutesToTime(CAL_START_HOUR * 60 + slot * CAL_SLOT_MINUTES);
}

function nowTopPxFor(now: Date): number {
  const minutes = now.getHours() * 60 + now.getMinutes() - CAL_START_HOUR * 60;
  return Math.max(0, minutes * CAL_PIXELS_PER_MINUTE);
}

function useNow(): Date {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function useAutoScrollToNow(
  containerRef: RefObject<HTMLDivElement>,
  shouldScroll: boolean,
  now: Date,
): void {
  useEffect(() => {
    if (!shouldScroll) return;
    const el = containerRef.current;
    if (!el) return;
    const minutesFromStart = now.getHours() * 60 + now.getMinutes() - CAL_START_HOUR * 60;
    if (minutesFromStart < 0) return;
    const targetTop = minutesFromStart * CAL_PIXELS_PER_MINUTE - el.clientHeight / 2;
    el.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldScroll]);
}

function TimeGutter() {
  return (
    <div className="relative w-[60px] flex-none border-r border-border/60 bg-card/30" style={{ height: `${CAL_HEIGHT_PX}px` }}>
      {hourLabels().map((h) => (
        <div key={h} className="absolute right-2 -translate-y-1/2 text-[10px] font-medium tabular-nums text-muted-foreground" style={{ top: `${timeToPixels(h)}px` }}>
          {h}
        </div>
      ))}
    </div>
  );
}

function GridLines() {
  return (
    <>
      {hourLabels().map((h) => (
        <div key={`hr-${h}`} className="pointer-events-none absolute left-0 right-0 border-t border-border/30" style={{ top: `${timeToPixels(h)}px` }} />
      ))}
      {Array.from({ length: CAL_END_HOUR - CAL_START_HOUR }).map((_, i) => {
        const half = `${String(CAL_START_HOUR + i).padStart(2, '0')}:30`;
        return <div key={`hf-${half}`} className="pointer-events-none absolute left-0 right-0 border-t border-border/10" style={{ top: `${timeToPixels(half)}px` }} />;
      })}
    </>
  );
}

interface BodyColumnProps {
  positioned: PositionedBooking[];
  clients: CalendarClient[];
  services: Service[];
  onSelectAppointment: (b: Booking) => void;
  showNowLine: boolean;
  nowTopPx: number;
  onCreate?: (time: string) => void;
  isLast?: boolean;
}

function BodyColumn({ positioned, clients, services, onSelectAppointment, showNowLine, nowTopPx, onCreate, isLast }: BodyColumnProps) {
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const yFromEvent = (e: React.MouseEvent<HTMLDivElement>) =>
    e.clientY - e.currentTarget.getBoundingClientRect().top;
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => setHoveredTime(computeTimeFromY(yFromEvent(e)));
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => onCreate?.(computeTimeFromY(yFromEvent(e)));
  const slotHeight = CAL_SLOT_MINUTES * CAL_PIXELS_PER_MINUTE;

  return (
    <div
      role="presentation"
      onMouseMove={handleMove}
      onMouseLeave={() => setHoveredTime(null)}
      onClick={handleClick}
      className={cn('relative flex-1', !isLast && 'border-r border-border/40')}
      style={{ height: `${CAL_HEIGHT_PX}px` }}
    >
      <GridLines />
      {hoveredTime && (
        <div
          className="pointer-events-none absolute inset-x-0 z-0 flex items-center justify-center bg-primary/5 ring-1 ring-inset ring-primary/30"
          style={{ top: `${timeToPixels(hoveredTime)}px`, height: `${slotHeight}px` }}
          aria-hidden="true"
        >
          <span className="flex items-center gap-1 rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm">
            <Plus className="size-3" />{hoveredTime}
          </span>
        </div>
      )}
      {positioned.map((p) => {
        const service = services.find((s) => s.id === p.booking.serviceId);
        const client = clients.find((c) => c.id === p.booking.clientId);
        return (
          <AppointmentBlock
            key={p.booking.id}
            booking={p.booking}
            client={client ? { name: client.name, avatar: client.avatar } : undefined}
            service={service ? { name: service.name, duration: service.duration } : undefined}
            onClick={() => onSelectAppointment(p.booking)}
            widthPercent={p.widthPercent}
            leftPercent={p.leftPercent}
          />
        );
      })}
      {showNowLine && (
        <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top: `${nowTopPx}px` }} aria-hidden="true">
          <div className="relative h-px bg-red-500">
            <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-red-500 shadow-sm" />
          </div>
        </div>
      )}
    </div>
  );
}

interface ShellProps {
  containerRef: RefObject<HTMLDivElement>;
  headers: React.ReactNode;
  body: React.ReactNode;
}
function Shell({ containerRef, headers, body }: ShellProps) {
  return (
    <div ref={containerRef} className="relative h-full max-h-[80vh] overflow-y-auto rounded-lg border border-border/60 bg-background">
      <div className="sticky top-0 z-30 flex border-b border-border/60 bg-card/90 backdrop-blur-sm">
        <div className="w-[60px] flex-none border-r border-border/60" />
        {headers}
      </div>
      <div className="flex">
        <TimeGutter />
        {body}
      </div>
    </div>
  );
}

export function CalendarWeekGrid({ date, bookings, staff, services, clients, onSelectAppointment, onCreateAt }: CalendarGridProps) {
  void staff; // parent filters; kept on interface for parity
  const days = useMemo(() => weekDays(date), [date]);
  const containerRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const todayVisible = days.some((d) => isToday(d));
  useAutoScrollToNow(containerRef, todayVisible, now);

  const headers = days.map((day) => (
    <div key={day.toISOString()} className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 border-r border-border/40 px-2 py-2 last:border-r-0', isToday(day) && 'bg-primary/10')}>
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{format(day, 'EEE')}</span>
      <span className={cn('text-base font-semibold tabular-nums', isToday(day) && 'text-primary')}>{format(day, 'd')}</span>
    </div>
  ));

  const body = days.map((day, idx) => {
    const positioned = positionBookings(bookingsForDate(bookings, day));
    const dateStr = format(day, 'yyyy-MM-dd');
    return (
      <BodyColumn
        key={day.toISOString()}
        positioned={positioned}
        clients={clients}
        services={services}
        onSelectAppointment={onSelectAppointment}
        showNowLine={isToday(day)}
        nowTopPx={nowTopPxFor(now)}
        onCreate={onCreateAt ? (time) => onCreateAt({ date: dateStr, time }) : undefined}
        isLast={idx === days.length - 1}
      />
    );
  });

  return <Shell containerRef={containerRef} headers={<>{headers}</>} body={<>{body}</>} />;
}

export function CalendarDayGrid({ date, bookings, staff, services, clients, onSelectAppointment, onCreateAt }: CalendarGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const showNowLine = isSameDay(date, now);
  useAutoScrollToNow(containerRef, showNowLine, now);
  const dateStr = format(date, 'yyyy-MM-dd');

  const headers = staff.map((s) => (
    <div key={s.id} className="flex flex-1 items-center justify-center gap-2 border-r border-border/40 px-2 py-2 last:border-r-0">
      {s.avatar ? (
        <img src={s.avatar} alt="" className="size-6 rounded-full object-cover" />
      ) : (
        <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium uppercase">{s.name.charAt(0)}</span>
      )}
      <span className="truncate text-xs font-semibold">{s.name}</span>
    </div>
  ));

  const body = staff.map((s, idx) => {
    const positioned = positionBookings(bookingsForStaffOnDate(bookings, s.id, date));
    return (
      <BodyColumn
        key={s.id}
        positioned={positioned}
        clients={clients}
        services={services}
        onSelectAppointment={onSelectAppointment}
        showNowLine={showNowLine}
        nowTopPx={nowTopPxFor(now)}
        onCreate={onCreateAt ? (time) => onCreateAt({ date: dateStr, time, staffId: s.id }) : undefined}
        isLast={idx === staff.length - 1}
      />
    );
  });

  return <Shell containerRef={containerRef} headers={<>{headers}</>} body={<>{body}</>} />;
}
