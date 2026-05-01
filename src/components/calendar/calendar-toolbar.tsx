import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addDays, addWeeks, startOfWeek, endOfWeek, isValid, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, Filter, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTenantStaff } from '@/lib/store/hooks';
import type { BookingStatus, ServiceCategory } from '@/types';
import { cn } from '@/lib/utils';

export type CalendarView = 'day' | 'week' | 'schedule';

export interface CalendarFilters {
  staffIds: string[];
  statuses: BookingStatus[];
  categories: ServiceCategory[];
}

interface CalendarToolbarProps {
  date: Date;
  view: CalendarView;
  onDateChange: (d: Date) => void;
  onViewChange: (v: CalendarView) => void;
  filters: CalendarFilters;
  onFiltersChange: (f: CalendarFilters) => void;
}

const VIEWS: ReadonlyArray<{ value: CalendarView; label: string }> = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'schedule', label: 'Schedule' },
];
const STATUSES: ReadonlyArray<BookingStatus> = ['confirmed', 'pending', 'completed', 'cancelled'];
const CATEGORIES: ReadonlyArray<ServiceCategory> = ['Hair', 'Nails', 'Skin'];

const shiftDate = (d: Date, view: CalendarView, dir: 1 | -1): Date =>
  view === 'week' ? addWeeks(d, dir) : view === 'schedule' ? addDays(d, dir * 7) : addDays(d, dir);

function formatLabel(d: Date, view: CalendarView): string {
  if (view !== 'week') return format(d, 'EEEE, MMM d');
  const s = startOfWeek(d, { weekStartsOn: 1 });
  const e = endOfWeek(d, { weekStartsOn: 1 });
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
}

const toggle = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter(x => x !== v) : [...list, v];

const parseList = <T extends string>(raw: string | null, allowed: ReadonlyArray<T>): T[] =>
  !raw ? [] : raw.split(',').filter((v): v is T => (allowed as ReadonlyArray<string>).includes(v));

const isView = (v: string | null): v is CalendarView =>
  v === 'day' || v === 'week' || v === 'schedule';

interface FilterItem { id: string; label: string; active: boolean; onToggle: () => void }

function FilterRow({ label, active, onToggle }: Omit<FilterItem, 'id'>) {
  return (
    <button type="button" onClick={onToggle}
      className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60">
      <span className="truncate">{label}</span>
      <span className={cn('flex size-4 items-center justify-center rounded-sm border',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
        {active && <Check className="size-3" />}
      </span>
    </button>
  );
}

export default function CalendarToolbar({
  date, view, onDateChange, onViewChange, filters, onFiltersChange,
}: CalendarToolbarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const staff = useTenantStaff();
  const hydrated = useRef(false);
  const lastUrlSig = useRef<string>('');

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const dateRaw = searchParams.get('date');
    if (dateRaw) {
      const parsed = parseISO(dateRaw);
      if (isValid(parsed)) onDateChange(parsed);
    }
    const v = searchParams.get('view');
    if (isView(v)) onViewChange(v);
    const staffIds = (searchParams.get('staff') ?? '').split(',').filter(Boolean);
    const statuses = parseList<BookingStatus>(searchParams.get('status'), STATUSES);
    const categories = parseList<ServiceCategory>(searchParams.get('cat'), CATEGORIES);
    if (staffIds.length || statuses.length || categories.length) {
      onFiltersChange({ staffIds, statuses, categories });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const next = new URLSearchParams(searchParams);
    next.set('date', format(date, 'yyyy-MM-dd'));
    next.set('view', view);
    const setOrDel = (k: string, v: string[]) =>
      v.length ? next.set(k, v.join(',')) : next.delete(k);
    setOrDel('staff', filters.staffIds);
    setOrDel('status', filters.statuses);
    setOrDel('cat', filters.categories);
    const sig = next.toString();
    if (sig === lastUrlSig.current || sig === searchParams.toString()) {
      lastUrlSig.current = sig;
      return;
    }
    lastUrlSig.current = sig;
    setSearchParams(next, { replace: true });
  }, [date, view, filters, searchParams, setSearchParams]);

  const filterCount = filters.staffIds.length + filters.statuses.length + filters.categories.length;
  const update = (patch: Partial<CalendarFilters>) => onFiltersChange({ ...filters, ...patch });
  const clearAll = () => onFiltersChange({ staffIds: [], statuses: [], categories: [] });

  const sections: Array<{ title: string; empty?: string; items: FilterItem[] }> = [
    {
      title: 'Staff',
      empty: staff.length === 0 ? 'No staff available' : undefined,
      items: staff.map(s => ({
        id: s.id, label: s.name, active: filters.staffIds.includes(s.id),
        onToggle: () => update({ staffIds: toggle(filters.staffIds, s.id) }),
      })),
    },
    {
      title: 'Status',
      items: STATUSES.map(s => ({
        id: s, label: s.charAt(0).toUpperCase() + s.slice(1),
        active: filters.statuses.includes(s),
        onToggle: () => update({ statuses: toggle(filters.statuses, s) }),
      })),
    },
    {
      title: 'Category',
      items: CATEGORIES.map(c => ({
        id: c, label: c, active: filters.categories.includes(c),
        onToggle: () => update({ categories: toggle(filters.categories, c) }),
      })),
    },
  ];

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onDateChange(new Date())}>Today</Button>
        <Button variant="ghost" size="icon-sm" aria-label="Previous"
          onClick={() => onDateChange(shiftDate(date, view, -1))}><ChevronLeft /></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Next"
          onClick={() => onDateChange(shiftDate(date, view, 1))}><ChevronRight /></Button>
        <Popover>
          <PopoverTrigger render={
            <Button variant="ghost" size="sm" className="gap-2 font-medium">
              <CalendarDays className="size-4" />{formatLabel(date, view)}
            </Button>
          } />
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={d => d && onDateChange(d)} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <div className="inline-flex items-center rounded-full bg-muted p-1">
          {VIEWS.map(v => (
            <button key={v.value} type="button" onClick={() => onViewChange(v.value)}
              className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                view === v.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground')}>
              {v.label}
            </button>
          ))}
        </div>
        <Popover>
          <PopoverTrigger render={
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" />Filters
              {filterCount > 0 && <Badge variant="default">{filterCount}</Badge>}
            </Button>
          } />
          <PopoverContent align="end" className="w-72 p-3">
            <div className="flex flex-col gap-3">
              {sections.map((sec, i) => (
                <div key={sec.title}>
                  {i > 0 && <Separator className="mb-3" />}
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{sec.title}</p>
                  {sec.empty && <p className="text-xs text-muted-foreground">{sec.empty}</p>}
                  <div className="flex flex-col">
                    {sec.items.map(it => (
                      <FilterRow key={it.id} label={it.label} active={it.active} onToggle={it.onToggle} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button type="button" onClick={clearAll}
                  className="text-xs font-medium text-primary hover:underline">Clear all</button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
