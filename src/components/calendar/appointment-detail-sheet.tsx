import { ComponentType, ReactNode, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Ban, Calendar as CalendarIcon, ChevronDown, CreditCard, Edit2, FileText,
  Image as ImageIcon, Lock, Mail, Phone, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Booking, BookingStatus } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { availableStartSlots } from '@/lib/booking/availability';
import { ALLOWED_TRANSITIONS, STATUS_META, defaultNextStatus, isTerminal } from '@/lib/booking/status-machine';
import { STATUS_STYLES, addMinutesToTime } from '@/lib/calendar/utils';
import { useStore } from '@/lib/store';
import { useTenantBookings, useTenantClients, useTenantServices, useTenantStaff } from '@/lib/store/hooks';
import { cn } from '@/lib/utils';

interface AppointmentDetailSheetProps {
  booking: Booking | null;
  onClose: () => void;
}

const initials = (name: string): string =>
  name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
const fmtCurrency = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const fmtDate = (iso: string): string => {
  try { return format(parseISO(iso), 'EEE, MMM d'); } catch { return iso; }
};

interface EmptyTabProps {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: ReactNode;
}
const EmptyTab = ({ Icon, title, body, action }: EmptyTabProps) => (
  <div className="flex h-full flex-col items-center justify-center py-12 text-center text-muted-foreground">
    <Icon className="mb-3 size-8 opacity-60" />
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="mt-1 max-w-[280px] text-xs">{body}</p>
    {action}
  </div>
);

// ── Inline status pill (MGN-402) ────────────────────────────────────────────
// Badge-styled DropdownMenu trigger. Shows only the next valid statuses.
// Terminal states render as a plain pill with no menu.
interface InlineStatusPillProps { bookingId: string; status: BookingStatus; }
function InlineStatusPill({ bookingId, status }: InlineStatusPillProps) {
  const updateBooking = useStore((s) => s.updateBooking);
  const styles = STATUS_STYLES[status];
  const meta = STATUS_META[status];
  const terminal = isTerminal(status);
  const pillClass = cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
    styles.badge,
  );
  if (terminal) return <span className={pillClass}>{meta.label}</span>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <button type="button" className={cn(pillClass, 'cursor-pointer hover:brightness-110')}>
          {meta.label}<ChevronDown className="size-3" />
        </button>
      } />
      <DropdownMenuContent align="start" className="w-48">
        {ALLOWED_TRANSITIONS[status].map((next) => (
          <DropdownMenuItem key={next} onClick={() => {
            updateBooking(bookingId, { status: next });
            toast.success(`Marked ${STATUS_META[next].label.toLowerCase()}`);
          }}>
            <span className={cn('mr-2 inline-block size-2 rounded-full', STATUS_STYLES[next].badge.split(' ')[0])} />
            {STATUS_META[next].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Reschedule dialog ───────────────────────────────────────────────────────
// Pick a new date + time slot. Excludes this booking from conflict checks
// so it doesn't conflict with itself.
interface RescheduleDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}
function RescheduleDialog({ booking, open, onOpenChange, onDone }: RescheduleDialogProps) {
  const services = useTenantServices();
  const staff = useTenantStaff();
  const allBookings = useTenantBookings();
  const updateBooking = useStore((s) => s.updateBooking);

  const [date, setDate] = useState<Date>(() => parseISO(booking.date));
  const [time, setTime] = useState<string>(booking.time);
  const [popOpen, setPopOpen] = useState(false);

  useEffect(() => {
    if (open) { setDate(parseISO(booking.date)); setTime(booking.time); }
  }, [open, booking.date, booking.time]);

  const dateStr = format(date, 'yyyy-MM-dd');
  const otherBookings = useMemo(
    () => allBookings.filter((b) => b.id !== booking.id),
    [allBookings, booking.id],
  );
  const slotOptions = useMemo(() => {
    const cart = [{ id: 'rs', serviceId: booking.serviceId, staffPreference: booking.staffId }];
    const slots = availableStartSlots(cart, dateStr, services, staff, otherBookings, undefined);
    const set = new Set(slots);
    if (dateStr === booking.date) set.add(booking.time); // self always selectable on same day
    return Array.from(set).sort();
  }, [booking.serviceId, booking.staffId, booking.date, booking.time, dateStr, services, staff, otherBookings]);

  const handleSave = () => {
    const svc = services.find((s) => s.id === booking.serviceId);
    if (!svc) { toast.error('Service no longer available'); return; }
    if (!slotOptions.includes(time)) { toast.error('That time is no longer available'); return; }
    updateBooking(booking.id, { date: dateStr, time, endTime: addMinutesToTime(time, svc.duration) });
    toast.success('Appointment rescheduled');
    onOpenChange(false);
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Reschedule appointment</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Popover open={popOpen} onOpenChange={setPopOpen}>
              <PopoverTrigger render={
                <Button variant="outline" className="w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 size-4" />{format(date, 'EEE, MMM d, yyyy')}
                </Button>
              } />
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar mode="single" selected={date}
                  onSelect={(d) => { if (d) { setDate(d); setPopOpen(false); } }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label>Time</Label>
            <Select value={time} onValueChange={(v) => setTime(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Pick a time" /></SelectTrigger>
              <SelectContent>
                {slotOptions.length === 0
                  ? <div className="px-2 py-3 text-sm text-muted-foreground">No available slots on this day</div>
                  : slotOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={slotOptions.length === 0}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add-service dialog (MGN-403) ────────────────────────────────────────────
// Appends a new booking to this booking's group at the latest endTime.
interface AddServiceDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
function AddServiceDialog({ booking, open, onOpenChange }: AddServiceDialogProps) {
  const services = useTenantServices();
  const staff = useTenantStaff();
  const allBookings = useTenantBookings();
  const addBooking = useStore((s) => s.addBooking);
  const updateBooking = useStore((s) => s.updateBooking);

  const [serviceId, setServiceId] = useState<string>('');
  const [staffId, setStaffId] = useState<string>('');
  useEffect(() => { if (open) { setServiceId(''); setStaffId(''); } }, [open]);

  const selectedService = services.find((s) => s.id === serviceId);
  const eligibleStaff = useMemo(
    () => (selectedService ? staff.filter((s) => s.isActive && selectedService.assignableStaff.includes(s.id)) : []),
    [staff, selectedService],
  );
  const startTime = useMemo(() => {
    const group = booking.groupId ? allBookings.filter((b) => b.groupId === booking.groupId) : [booking];
    return group.reduce((max, b) => (b.endTime > max ? b.endTime : max), booking.endTime);
  }, [allBookings, booking]);
  const endTime = selectedService ? addMinutesToTime(startTime, selectedService.duration) : '';
  const conflict = useMemo(() => {
    if (!selectedService || !staffId) return false;
    return allBookings.some((b) =>
      b.staffId === staffId && b.date === booking.date && b.status !== 'cancelled' &&
      startTime < b.endTime && endTime > b.time,
    );
  }, [allBookings, booking.date, selectedService, staffId, startTime, endTime]);

  const handleSave = () => {
    if (!selectedService || !staffId) { toast.error('Pick a service and a staff member'); return; }
    if (conflict) { toast.error('That staff member is busy at this time'); return; }
    let groupId = booking.groupId;
    if (!groupId) {
      groupId = `grp-${Date.now()}`;
      updateBooking(booking.id, { groupId });
    }
    addBooking({
      id: `bk-${Date.now()}`,
      clientId: booking.clientId, staffId, serviceId: selectedService.id,
      date: booking.date, time: startTime, endTime,
      status: 'confirmed', notes: booking.notes, privateNotes: '', groupId,
      createdAt: new Date().toISOString(),
    });
    toast.success('Service added to visit');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add another service</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Service</Label>
            <Select value={serviceId} onValueChange={(v) => { setServiceId(v ?? ''); setStaffId(''); }}>
              <SelectTrigger><SelectValue placeholder="Pick a service" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.duration}min · {fmtCurrency(s.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Staff</Label>
            <Select value={staffId} onValueChange={(v) => setStaffId(v ?? '')} disabled={!selectedService}>
              <SelectTrigger>
                <SelectValue placeholder={selectedService ? 'Pick a staff member' : 'Pick a service first'} />
              </SelectTrigger>
              <SelectContent>
                {eligibleStaff.length === 0
                  ? <div className="px-2 py-3 text-sm text-muted-foreground">No staff available for this service</div>
                  : eligibleStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {selectedService ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              Will start at <span className="font-mono text-foreground">{startTime}</span>
              {' · ends '}<span className="font-mono text-foreground">{endTime}</span>
              {conflict ? <div className="mt-1 text-destructive">Selected staff is busy at this time.</div> : null}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedService || !staffId || conflict}>
            <Plus className="mr-1.5 size-4" />Add service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main sheet ──────────────────────────────────────────────────────────────
export default function AppointmentDetailSheet({ booking, onClose }: AppointmentDetailSheetProps) {
  const clients = useTenantClients();
  const staff = useTenantStaff();
  const services = useTenantServices();
  const allBookings = useTenantBookings();
  const updateBooking = useStore((s) => s.updateBooking);
  const cancelBooking = useStore((s) => s.cancelBooking);

  // Notes auto-save state (MGN-405). Plain text only in Epic 4 — markdown
  // rendering arrives in a later epic.
  const [clientNote, setClientNote] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [addServiceOpen, setAddServiceOpen] = useState(false);

  useEffect(() => {
    if (booking) { setClientNote(booking.notes ?? ''); setStaffNote(booking.privateNotes ?? ''); }
  }, [booking]);

  const handleOpenChange = (next: boolean) => { if (!next) onClose(); };
  if (!booking) return <Sheet open={false} onOpenChange={handleOpenChange} />;

  const client = clients.find((c) => c.id === booking.clientId);
  const sf = staff.find((s) => s.id === booking.staffId);
  const svc = services.find((s) => s.id === booking.serviceId);
  const clientName = client?.name ?? 'Unknown client';
  const next = defaultNextStatus(booking.status);
  const terminal = isTerminal(booking.status);
  const isPast = (() => {
    try { return parseISO(`${booking.date}T${booking.endTime}:00`).getTime() < Date.now(); }
    catch { return false; }
  })();
  const groupSiblings = booking.groupId
    ? allBookings.filter((b) => b.groupId === booking.groupId && b.id !== booking.id)
    : [];

  const onAdvance = () => {
    if (!next) return;
    updateBooking(booking.id, { status: next });
    toast.success(`Marked ${STATUS_META[next].label.toLowerCase()}`);
    onClose();
  };
  const onCancel = () => { cancelBooking(booking.id); toast.success('Appointment cancelled'); onClose(); };
  const onMarkNoShow = () => { updateBooking(booking.id, { status: 'no_show' }); toast.success('Marked no-show'); onClose(); };
  const saveNote = (field: 'notes' | 'privateNotes', value: string) => {
    const current = field === 'notes' ? (booking.notes ?? '') : (booking.privateNotes ?? '');
    if (value === current) return;
    updateBooking(booking.id, { [field]: value });
    toast.success('Note saved', { duration: 1500 });
  };

  const chipClass =
    'inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted';
  const tabContentClass = 'flex-1 overflow-y-auto px-6 py-4 space-y-5 mt-0';

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start gap-3">
            <Avatar className="size-12">
              {client?.avatar ? <AvatarImage src={client.avatar} alt={clientName} /> : null}
              <AvatarFallback>{initials(clientName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-lg">{clientName}</SheetTitle>
              <SheetDescription className="sr-only">Appointment detail for {clientName}</SheetDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {client?.email ? (
                  <a href={`mailto:${client.email}`} className={chipClass}><Mail className="size-3" /><span className="max-w-[160px] truncate">{client.email}</span></a>
                ) : null}
                {client?.phone ? (
                  <a href={`tel:${client.phone}`} className={chipClass}><Phone className="size-3" /><span>{client.phone}</span></a>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-3"><InlineStatusPill bookingId={booking.id} status={booking.status} /></div>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex flex-1 min-h-0 flex-col">
          <TabsList className="mx-6 mt-3 grid w-auto grid-cols-5">
            <TabsTrigger value="details"><FileText className="mr-1 size-3.5" />Details</TabsTrigger>
            <TabsTrigger value="notes"><Edit2 className="mr-1 size-3.5" />Notes</TabsTrigger>
            <TabsTrigger value="forms"><FileText className="mr-1 size-3.5" />Forms</TabsTrigger>
            <TabsTrigger value="photos"><ImageIcon className="mr-1 size-3.5" />Photos</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="mr-1 size-3.5" />Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className={tabContentClass}>
            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="font-semibold">{svc?.name ?? 'Service'}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {svc ? `${svc.duration} min · ${fmtCurrency(svc.price)}` : '—'}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Avatar className="size-7">
                  {sf?.avatar ? <AvatarImage src={sf.avatar} alt={sf.name} /> : null}
                  <AvatarFallback>{initials(sf?.name ?? '?')}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <span className="text-muted-foreground">with </span>
                  <span className="font-medium">{sf?.name ?? 'Unassigned'}</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {fmtDate(booking.date)} · <span className="font-mono text-foreground">{booking.time} – {booking.endTime}</span>
              </div>
            </div>

            {groupSiblings.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Same visit</div>
                {groupSiblings.map((sib) => {
                  const sibSvc = services.find((s) => s.id === sib.serviceId);
                  const sibStaff = staff.find((s) => s.id === sib.staffId);
                  return (
                    <div key={sib.id} className="rounded-xl border bg-card p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{sibSvc?.name ?? 'Service'}</div>
                        <div className="text-xs text-muted-foreground">with {sibStaff?.name ?? 'Unassigned'}</div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground font-mono">{sib.time} – {sib.endTime}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <Button variant="outline" className="w-full" onClick={() => setAddServiceOpen(true)}>
              <Plus className="mr-1.5 size-4" />Add another service
            </Button>
          </TabsContent>

          <TabsContent value="notes" className={tabContentClass}>
            <div className="space-y-1.5">
              <Label htmlFor="note-client">Note for client</Label>
              <Textarea id="note-client" rows={4} value={clientNote} placeholder="Visible in confirmation emails."
                onChange={(e) => setClientNote(e.target.value)} onBlur={() => saveNote('notes', clientNote)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note-staff" className="flex items-center gap-1.5"><Lock className="size-3.5" />Internal staff note</Label>
              <Textarea id="note-staff" rows={4} value={staffNote} placeholder="Not shared with the client."
                onChange={(e) => setStaffNote(e.target.value)} onBlur={() => saveNote('privateNotes', staffNote)} />
            </div>
          </TabsContent>

          <TabsContent value="forms" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <EmptyTab Icon={FileText} title="Forms coming soon" body="Send intake forms to clients before their visit." />
          </TabsContent>
          <TabsContent value="photos" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <EmptyTab Icon={ImageIcon} title="Photos coming soon" body="Upload before/after shots and reference images." />
          </TabsContent>
          <TabsContent value="payments" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <EmptyTab Icon={CreditCard} title="Payments come from Checkout"
              body="Open the appointment in Checkout to take payment."
              action={<Button variant="outline" className="mt-4" onClick={() => toast('Coming in Epic 6 — checkout / POS')}>Go to checkout</Button>} />
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 mt-auto border-t bg-background px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {next && !terminal ? (
              <Button onClick={onAdvance} className="flex-1 min-w-[140px]">
                {STATUS_META[next].actionLabel}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setRescheduleOpen(true)} className="flex-1 min-w-[140px]">
              <CalendarIcon className="mr-1.5 size-4" />Reschedule
            </Button>
            {!terminal ? (
              <Button variant="ghost" onClick={onCancel} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Ban className="mr-1.5 size-4" />Cancel
              </Button>
            ) : null}
            {booking.status === 'confirmed' && isPast ? <Button variant="ghost" onClick={onMarkNoShow}>Mark no-show</Button> : null}
          </div>
        </div>

        <RescheduleDialog booking={booking} open={rescheduleOpen}
          onOpenChange={setRescheduleOpen} onDone={onClose} />
        <AddServiceDialog booking={booking} open={addServiceOpen}
          onOpenChange={setAddServiceOpen} />
      </SheetContent>
    </Sheet>
  );
}
