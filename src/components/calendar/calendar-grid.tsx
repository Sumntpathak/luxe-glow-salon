import { useEffect, useMemo, useRef, useState, useCallback, type RefObject } from 'react';
import { format, isSameDay, isToday, addDays, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Booking, Service, Staff } from '@/types';
import {
  CAL_END_HOUR, CAL_HEIGHT_PX, CAL_PIXELS_PER_MINUTE, CAL_SLOT_MINUTES, CAL_START_HOUR,
  bookingsForDate, bookingsForStaffOnDate, hourLabels, minutesToTime,
  timeToMinutes, timeToPixels, weekDays, hasConflict, snapToSlot, pixelsToTime,
  durationToPixels,
} from '@/lib/calendar/utils';
import { cn } from '@/lib/utils';
import AppointmentBlock from './appointment-block';

interface CalendarClient { id: string; name: string; avatar?: string }
export interface RescheduleInput {
  bookingId: string;
  newDate: string;     // YYYY-MM-DD
  newTime: string;     // HH:mm (start)
  newEndTime: string;  // HH:mm (end)
  newStaffId?: string;
}
interface CalendarGridProps {
  date: Date;
  bookings: Booking[];
  staff: Staff[];
  services: Service[];
  clients: CalendarClient[];
  onSelectAppointment: (b: Booking) => void;
  onCreateAt?: (input: { date: string; time: string; staffId?: string }) => void;
  onReschedule?: (input: RescheduleInput) => void;
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

// ── Drag-to-reschedule (MGN-204) ──────────────────────────────────────────
// A pointer-down on an AppointmentBlock starts an intent to drag. It only
// becomes a real drag once the cursor moves past CLICK_DRAG_THRESHOLD_PX
// (4px). Below that threshold, pointer-up = click → opens detail sheet.
// During an active drag, we render a position:fixed ghost div that follows
// the cursor (with snap-to-slot vertical alignment). The ghost is rendered
// outside the BodyColumn React tree so move ticks don't re-render the grid.
const CLICK_DRAG_THRESHOLD_PX = 4;

type DragMode = 'move' | 'resize';

interface ColumnDescriptor {
  el: HTMLDivElement;
  staffId?: string;
  date: string;
}

interface ActiveDrag {
  mode: DragMode;
  bookingId: string;
  origin: { x: number; y: number };
  // origin booking metadata
  origStaffId: string;
  origDate: string;
  origTime: string;
  origEndTime: string;
  origDurationMin: number;
  // visual rect of source block (for ghost size + position)
  blockRect: { width: number; height: number };
}

interface GhostState {
  visible: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  label: string;
  conflict: boolean;
  reverting: boolean;
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
  // drag wiring
  staffId?: string;
  date: string;
  draggedBookingId: string | null;
  registerColumn: (key: string, desc: ColumnDescriptor | null) => void;
  onBlockPointerDown?: (e: React.PointerEvent<HTMLDivElement>, b: Booking, mode: DragMode) => void;
}

function BodyColumn({
  positioned, clients, services, onSelectAppointment, showNowLine, nowTopPx, onCreate, isLast,
  staffId, date, draggedBookingId, registerColumn, onBlockPointerDown,
}: BodyColumnProps) {
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const colKey = `${date}::${staffId ?? '*'}`;

  useEffect(() => {
    if (colRef.current) registerColumn(colKey, { el: colRef.current, staffId, date });
    return () => registerColumn(colKey, null);
  }, [colKey, staffId, date, registerColumn]);

  const yFromEvent = (e: React.MouseEvent<HTMLDivElement>) =>
    e.clientY - e.currentTarget.getBoundingClientRect().top;
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => setHoveredTime(computeTimeFromY(yFromEvent(e)));
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Suppress create when click target is an appointment block (covered by stopPropagation already, but be defensive).
    if ((e.target as HTMLElement).closest('[data-appointment-block]')) return;
    onCreate?.(computeTimeFromY(yFromEvent(e)));
  };
  const slotHeight = CAL_SLOT_MINUTES * CAL_PIXELS_PER_MINUTE;

  return (
    <div
      ref={colRef}
      role="presentation"
      data-cal-column
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
        const isBeingDragged = draggedBookingId === p.booking.id;
        return (
          <AppointmentBlock
            key={p.booking.id}
            booking={p.booking}
            client={client ? { name: client.name, avatar: client.avatar } : undefined}
            service={service ? { name: service.name, duration: service.duration } : undefined}
            onClick={() => onSelectAppointment(p.booking)}
            widthPercent={p.widthPercent}
            leftPercent={p.leftPercent}
            isDragging={isBeingDragged}
            onDragStart={onBlockPointerDown ? (e) => onBlockPointerDown(e, p.booking, 'move') : undefined}
            onResizeStart={onBlockPointerDown ? (e) => onBlockPointerDown(e, p.booking, 'resize') : undefined}
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
  ghost?: React.ReactNode;
}
function Shell({ containerRef, headers, body, ghost }: ShellProps) {
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
      {ghost}
    </div>
  );
}

// ── Shared drag controller hook ───────────────────────────────────────────
interface DragControllerArgs {
  bookings: Booking[];
  services: Service[];
  view: 'week' | 'day';
  onReschedule?: (input: RescheduleInput) => void;
}

interface DragController {
  draggedBookingId: string | null;
  registerColumn: (key: string, desc: ColumnDescriptor | null) => void;
  onBlockPointerDown: (e: React.PointerEvent<HTMLDivElement>, b: Booking, mode: DragMode) => void;
  ghost: GhostState;
}

function useDragController({ bookings, services, view, onReschedule }: DragControllerArgs): DragController {
  const columnsRef = useRef<Map<string, ColumnDescriptor>>(new Map());
  const dragRef = useRef<ActiveDrag | null>(null);
  const armedRef = useRef<ActiveDrag | null>(null); // pointer-down before threshold
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<GhostState>({
    visible: false, left: 0, top: 0, width: 0, height: 0, label: '', conflict: false, reverting: false,
  });

  const registerColumn = useCallback((key: string, desc: ColumnDescriptor | null) => {
    if (desc) columnsRef.current.set(key, desc);
    else columnsRef.current.delete(key);
  }, []);

  const findColumnAtPoint = useCallback((x: number, y: number): ColumnDescriptor | null => {
    for (const desc of columnsRef.current.values()) {
      const r = desc.el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return desc;
    }
    return null;
  }, []);

  const computeProposed = useCallback((d: ActiveDrag, clientX: number, clientY: number) => {
    const dy = clientY - d.origin.y;
    if (d.mode === 'resize') {
      const newDurationMin = Math.max(CAL_SLOT_MINUTES, snapToSlot(d.origDurationMin + dy / CAL_PIXELS_PER_MINUTE));
      const startMin = timeToMinutes(d.origTime);
      const endMin = Math.min(CAL_END_HOUR * 60, startMin + newDurationMin);
      return {
        staffId: d.origStaffId,
        date: d.origDate,
        time: d.origTime,
        endTime: minutesToTime(endMin),
        durationMin: endMin - startMin,
      };
    }
    // MOVE
    const col = findColumnAtPoint(clientX, clientY);
    const targetStaffId = view === 'day' ? (col?.staffId ?? d.origStaffId) : d.origStaffId;
    const targetDate = view === 'week' ? (col?.date ?? d.origDate) : d.origDate;
    const minutesShift = snapToSlot(dy / CAL_PIXELS_PER_MINUTE);
    const startMin = Math.max(CAL_START_HOUR * 60, Math.min(CAL_END_HOUR * 60 - d.origDurationMin, timeToMinutes(d.origTime) + minutesShift));
    return {
      staffId: targetStaffId,
      date: targetDate,
      time: minutesToTime(startMin),
      endTime: minutesToTime(startMin + d.origDurationMin),
      durationMin: d.origDurationMin,
    };
  }, [findColumnAtPoint, view]);

  const computeGhostRect = useCallback((d: ActiveDrag, proposedStaffId: string, proposedDate: string, proposedTime: string, durationMin: number): { left: number; top: number; width: number; height: number } => {
    const colKey = `${proposedDate}::${proposedStaffId ?? '*'}`;
    // Try staff-specific (day view) first, then date-only fallback (week view).
    const col = columnsRef.current.get(colKey)
      ?? columnsRef.current.get(`${proposedDate}::*`)
      ?? Array.from(columnsRef.current.values()).find((c) => c.date === proposedDate);
    if (!col) return { left: 0, top: 0, width: d.blockRect.width, height: d.blockRect.height };
    const r = col.el.getBoundingClientRect();
    return {
      left: r.left + 2,
      top: r.top + timeToPixels(proposedTime),
      width: r.width - 4,
      height: durationToPixels(durationMin),
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const armed = armedRef.current;
      if (armed && !dragRef.current) {
        const dx = e.clientX - armed.origin.x;
        const dy = e.clientY - armed.origin.y;
        if (Math.hypot(dx, dy) >= CLICK_DRAG_THRESHOLD_PX) {
          dragRef.current = armed;
          setDraggedBookingId(armed.bookingId);
        } else {
          return;
        }
      }
      const d = dragRef.current;
      if (!d) return;
      const proposed = computeProposed(d, e.clientX, e.clientY);
      const conflict = hasConflict(bookings, proposed.staffId, proposed.date, proposed.time, proposed.endTime, d.bookingId);
      const rect = computeGhostRect(d, proposed.staffId, proposed.date, proposed.time, proposed.durationMin);
      const label = conflict ? 'Conflict' : `${proposed.time} – ${proposed.endTime}`;
      setGhost({ visible: true, ...rect, label, conflict, reverting: false });
    };

    const handlePointerUp = (e: PointerEvent) => {
      const d = dragRef.current;
      armedRef.current = null;
      if (!d) {
        // Pure click — let the block's onClick fire naturally.
        return;
      }
      const proposed = computeProposed(d, e.clientX, e.clientY);
      const conflict = hasConflict(bookings, proposed.staffId, proposed.date, proposed.time, proposed.endTime, d.bookingId);
      const sameAsOrig =
        proposed.staffId === d.origStaffId
        && proposed.date === d.origDate
        && proposed.time === d.origTime
        && proposed.endTime === d.origEndTime;

      if (conflict) {
        toast.error('Conflict — that slot is already booked');
        // Animate ghost back to origin
        const origRect = computeGhostRect(d, d.origStaffId, d.origDate, d.origTime, d.origDurationMin);
        setGhost((g) => ({ ...g, ...origRect, reverting: true, conflict: false, label: `${d.origTime} – ${d.origEndTime}` }));
        window.setTimeout(() => {
          setGhost((g) => ({ ...g, visible: false, reverting: false }));
          setDraggedBookingId(null);
        }, 220);
      } else if (sameAsOrig) {
        setGhost((g) => ({ ...g, visible: false }));
        setDraggedBookingId(null);
      } else {
        if (onReschedule) {
          onReschedule({
            bookingId: d.bookingId,
            newDate: proposed.date,
            newTime: proposed.time,
            newEndTime: proposed.endTime,
            newStaffId: proposed.staffId !== d.origStaffId ? proposed.staffId : undefined,
          });
        }
        setGhost((g) => ({ ...g, visible: false }));
        setDraggedBookingId(null);
      }
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [bookings, services, computeProposed, computeGhostRect, onReschedule]);

  const onBlockPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, b: Booking, mode: DragMode) => {
    if (!onReschedule) return; // disabled when no callback wired
    const target = (e.currentTarget.closest('[data-appointment-block]') as HTMLElement | null) ?? e.currentTarget;
    const rect = target.getBoundingClientRect();
    const durationMin = timeToMinutes(b.endTime) - timeToMinutes(b.time);
    armedRef.current = {
      mode,
      bookingId: b.id,
      origin: { x: e.clientX, y: e.clientY },
      origStaffId: b.staffId,
      origDate: b.date,
      origTime: b.time,
      origEndTime: b.endTime,
      origDurationMin: durationMin,
      blockRect: { width: rect.width, height: rect.height },
    };
    // Resize starts immediately — no click ambiguity for the lip.
    if (mode === 'resize') {
      dragRef.current = armedRef.current;
      setDraggedBookingId(b.id);
      setGhost({
        visible: true,
        left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        label: `${b.time} – ${b.endTime}`, conflict: false, reverting: false,
      });
    }
  }, [onReschedule]);

  return { draggedBookingId, registerColumn, onBlockPointerDown, ghost };
}

function GhostOverlay({ ghost }: { ghost: GhostState }) {
  if (!ghost.visible) return null;
  return (
    <>
      <div
        className={cn(
          'pointer-events-none fixed z-50 rounded-md border border-l-4 bg-primary/30 backdrop-blur-sm shadow-lg',
          ghost.conflict && 'ring-2 ring-red-500 bg-red-500/20',
          ghost.reverting && 'transition-all duration-200 ease-out',
        )}
        style={{ left: `${ghost.left}px`, top: `${ghost.top}px`, width: `${ghost.width}px`, height: `${ghost.height}px` }}
        aria-hidden="true"
      />
      <div
        className={cn(
          'pointer-events-none fixed z-50 -translate-y-full rounded-md px-2 py-1 text-[11px] font-medium shadow-md',
          ghost.conflict ? 'bg-red-500 text-white' : 'bg-foreground text-background',
        )}
        style={{ left: `${ghost.left + ghost.width / 2}px`, top: `${ghost.top - 4}px`, transform: 'translate(-50%, -100%)' }}
      >
        {ghost.label}
      </div>
    </>
  );
}

export function CalendarWeekGrid({ date, bookings, staff, services, clients, onSelectAppointment, onCreateAt, onReschedule }: CalendarGridProps) {
  void staff;
  const days = useMemo(() => weekDays(date), [date]);
  const containerRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const todayVisible = days.some((d) => isToday(d));
  useAutoScrollToNow(containerRef, todayVisible, now);

  const drag = useDragController({ bookings, services, view: 'week', onReschedule });

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
        date={dateStr}
        draggedBookingId={drag.draggedBookingId}
        registerColumn={drag.registerColumn}
        onBlockPointerDown={drag.onBlockPointerDown}
      />
    );
  });

  // Suppress unused import warnings (helpers reserved for future use).
  void addDays; void startOfWeek;

  return <Shell containerRef={containerRef} headers={<>{headers}</>} body={<>{body}</>} ghost={<GhostOverlay ghost={drag.ghost} />} />;
}

export function CalendarDayGrid({ date, bookings, staff, services, clients, onSelectAppointment, onCreateAt, onReschedule }: CalendarGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const showNowLine = isSameDay(date, now);
  useAutoScrollToNow(containerRef, showNowLine, now);
  const dateStr = format(date, 'yyyy-MM-dd');

  const drag = useDragController({ bookings, services, view: 'day', onReschedule });

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
        staffId={s.id}
        date={dateStr}
        draggedBookingId={drag.draggedBookingId}
        registerColumn={drag.registerColumn}
        onBlockPointerDown={drag.onBlockPointerDown}
      />
    );
  });

  return <Shell containerRef={containerRef} headers={<>{headers}</>} body={<>{body}</>} ghost={<GhostOverlay ghost={drag.ghost} />} />;
}

// Suppress unused import (pixelsToTime reserved for resize edge cases).
void pixelsToTime;
