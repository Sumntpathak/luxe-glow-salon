import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parse, addMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import { Booking, BookingStatus } from '@/types';
import { useStore } from '@/lib/store';
import { useTenantBookings, useTenantStaff, useTenantServices, useTenantClients } from '@/lib/store/hooks';
import { applyFilters, weekDays, hasConflict } from '@/lib/calendar/utils';
import { CalendarWeekGrid, CalendarDayGrid } from '@/components/calendar/calendar-grid';
import CalendarToolbar, { type CalendarView, type CalendarFilters } from '@/components/calendar/calendar-toolbar';
import TodayQueue from '@/components/calendar/today-queue';
import AppointmentDetailSheet from '@/components/calendar/appointment-detail-sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuickCreateState {
  date: string;
  time: string;
  staffId?: string;
}

export default function AdminCalendarPage() {
  const navigate = useNavigate();
  const bookings = useTenantBookings('org'); // org-wide; toolbar filters narrow further
  const staff = useTenantStaff('org');
  const services = useTenantServices('org');
  const clients = useTenantClients();
  const addBooking = useStore((s) => s.addBooking);
  const updateBooking = useStore((s) => s.updateBooking);

  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [filters, setFilters] = useState<CalendarFilters>({ staffIds: [], statuses: [], categories: [] });
  const [selected, setSelected] = useState<Booking | null>(null);
  const [quickCreate, setQuickCreate] = useState<QuickCreateState | null>(null);

  // ── Filtered + category-pruned booking set ──────────────────────────────
  const filtered = useMemo(() => {
    let result = applyFilters(bookings, {
      staffIds: filters.staffIds,
      statuses: filters.statuses as BookingStatus[],
    });
    if (filters.categories.length > 0) {
      const okSvcIds = new Set(services.filter((s) => filters.categories.includes(s.category)).map((s) => s.id));
      result = result.filter((b) => okSvcIds.has(b.serviceId));
    }
    return result;
  }, [bookings, services, filters]);

  // Visible staff (when staff filter is applied, narrow the day-view columns).
  const visibleStaff = useMemo(() => {
    if (filters.staffIds.length === 0) return staff;
    const set = new Set(filters.staffIds);
    return staff.filter((s) => set.has(s.id));
  }, [staff, filters.staffIds]);

  const handleSelectAppointment = useCallback((b: Booking) => setSelected(b), []);
  const handleCreateAt = useCallback((input: QuickCreateState) => setQuickCreate(input), []);

  // Stabilize the client array passed to grid components so they don't re-render on every parent render.
  const clientLite = useMemo(
    () => clients.map((c) => ({ id: c.id, name: c.name, avatar: c.avatar })),
    [clients],
  );

  // ── Schedule view (list) — fallback for power users / mobile-friendly ──
  const renderSchedule = () => {
    const days = view === 'schedule' ? weekDays(date) : [];
    return (
      <div className="divide-y divide-border/40">
        {days.map((d) => {
          const dayStr = format(d, 'yyyy-MM-dd');
          const items = filtered.filter((b) => b.date === dayStr).sort((a, b) => a.time.localeCompare(b.time));
          if (items.length === 0) return null;
          return (
            <div key={dayStr} className="py-3">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground px-4 mb-2">
                {format(d, 'EEEE, MMM d')}
              </h3>
              <ul className="divide-y divide-border/30">
                {items.map((b) => {
                  const c = clients.find((x) => x.id === b.clientId);
                  const sv = services.find((x) => x.id === b.serviceId);
                  const st = staff.find((x) => x.id === b.staffId);
                  return (
                    <li
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className="flex items-center gap-4 px-4 py-2.5 hover:bg-muted/50 cursor-pointer"
                    >
                      <span className="font-mono text-xs w-20 shrink-0 text-muted-foreground">
                        {b.time} – {b.endTime}
                      </span>
                      <span className="font-medium text-sm flex-1 truncate">{c?.name ?? 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[160px]">
                        {sv?.name} · {st?.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {filtered.filter((b) => weekDays(date).some((d) => format(d, 'yyyy-MM-dd') === b.date)).length === 0 && (
          <p className="p-12 text-center text-muted-foreground">No appointments this week.</p>
        )}
      </div>
    );
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveView: CalendarView = isMobile && view === 'week' ? 'day' : view;

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] -mt-6 -mx-4 md:-mx-8">
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
          <CalendarToolbar
            date={date}
            view={view}
            onDateChange={setDate}
            onViewChange={setView}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <div className="flex-1 overflow-hidden">
            {effectiveView === 'week' && (
              <CalendarWeekGrid
                date={date}
                bookings={filtered}
                staff={visibleStaff}
                services={services}
                clients={clientLite}
                onSelectAppointment={handleSelectAppointment}
                onCreateAt={handleCreateAt}
              />
            )}
            {effectiveView === 'day' && (
              <CalendarDayGrid
                date={date}
                bookings={filtered}
                staff={visibleStaff}
                services={services}
                clients={clientLite}
                onSelectAppointment={handleSelectAppointment}
                onCreateAt={handleCreateAt}
              />
            )}
            {effectiveView === 'schedule' && renderSchedule()}
          </div>
        </div>
        <TodayQueue onSelectAppointment={handleSelectAppointment} />
      </div>

      <AppointmentDetailSheet booking={selected} onClose={() => setSelected(null)} />

      {/* MGN-203 Quick-create dialog (inline composer; full drag-create polish in Epic 4). */}
      {quickCreate && (
        <QuickCreateDialog
          state={quickCreate}
          onClose={() => setQuickCreate(null)}
          onCreate={(payload) => {
            // Conflict check
            const sv = services.find((s) => s.id === payload.serviceId);
            if (!sv) return toast.error('Service not found');
            const start = parse(payload.time, 'HH:mm', new Date());
            const end = addMinutes(start, sv.duration);
            const endTime = format(end, 'HH:mm');
            if (hasConflict(bookings, payload.staffId, payload.date, payload.time, endTime)) {
              return toast.error('Time conflict — that staff member is already booked');
            }
            addBooking({
              id: `bk-${Date.now()}`,
              clientId: payload.clientId,
              staffId: payload.staffId,
              serviceId: payload.serviceId,
              date: payload.date,
              time: payload.time,
              endTime,
              status: 'confirmed' as const,
              notes: '',
              createdAt: new Date().toISOString(),
            });
            toast.success('Appointment created');
            setQuickCreate(null);
          }}
        />
      )}
    </>
  );

  // Suppress lint for unused; reserved for future drag-rescheduler.
  void updateBooking;
  void navigate;
}

// ── Quick-create dialog (MGN-203) ──────────────────────────────────────────
interface QuickCreatePayload {
  date: string; time: string; staffId: string; serviceId: string; clientId: string;
}

function QuickCreateDialog({
  state, onClose, onCreate,
}: {
  state: QuickCreateState;
  onClose: () => void;
  onCreate: (p: QuickCreatePayload) => void;
}) {
  const services = useTenantServices('org');
  const staff = useTenantStaff('org');
  const clients = useTenantClients();
  const [serviceId, setServiceId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>(state.staffId ?? '');
  const [clientId, setClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');

  const eligibleStaff = useMemo(() => {
    if (!serviceId) return staff;
    const sv = services.find((s) => s.id === serviceId);
    if (!sv) return staff;
    return staff.filter((s) => sv.assignableStaff.includes(s.id));
  }, [services, staff, serviceId]);

  const matchedClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 5);
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 5);
  }, [clients, clientSearch]);

  const canSave = serviceId && staffId && clientId;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New appointment · {state.date} at {state.time}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="qc-client">Client</Label>
            <Input
              id="qc-client"
              placeholder="Search clients..."
              value={clientId ? clients.find((c) => c.id === clientId)?.name ?? clientSearch : clientSearch}
              onChange={(e) => { setClientId(''); setClientSearch(e.target.value); }}
            />
            {!clientId && clientSearch && (
              <ul className="border rounded-md bg-popover max-h-40 overflow-y-auto">
                {matchedClients.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => { setClientId(c.id); setClientSearch(''); }}
                    >
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </button>
                  </li>
                ))}
                {matchedClients.length === 0 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">No matches</li>
                )}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qc-service">Service</Label>
            <Select value={serviceId} onValueChange={(v) => setServiceId(v ?? '')}>
              <SelectTrigger id="qc-service"><SelectValue placeholder="Pick a service" /></SelectTrigger>
              <SelectContent>
                {services.filter((s) => s.isActive).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.duration}min · ${s.price}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qc-staff">Staff</Label>
            <Select value={staffId} onValueChange={(v) => setStaffId(v ?? '')}>
              <SelectTrigger id="qc-staff"><SelectValue placeholder="Pick staff" /></SelectTrigger>
              <SelectContent>
                {eligibleStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!canSave}
            onClick={() => onCreate({ date: state.date, time: state.time, staffId, serviceId, clientId })}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
