

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMinutes,
  isToday,
} from 'date-fns';
import toast from 'react-hot-toast';
import { Booking } from '@/types';

const COLOR_PALETTE = [
  { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
];

function getStaffColor(staffId: string, allStaffIds: string[]) {
  const index = allStaffIds.indexOf(staffId);
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminBookingsPage() {
  const {
    bookings,
    staff,
    clients,
    services,
    addBooking,
    cancelBooking,
    updateBooking,
  } = useStore();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [filterStaff, setFilterStaff] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Create booking form state
  const [formClientId, setFormClientId] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formStaffId, setFormStaffId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const allStaffIds = useMemo(() => staff.map((s) => s.id), [staff]);

  const weekDays = useMemo(() => {
    const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end });
  }, [currentWeekStart]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filterStaff !== 'all' && b.staffId !== filterStaff) return false;
      if (filterService !== 'all' && b.serviceId !== filterService) return false;
      return true;
    });
  }, [bookings, filterStaff, filterService]);

  const bookingsByDay = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      map[key] = filteredBookings
        .filter((b) => b.date === key)
        .sort((a, b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [weekDays, filteredBookings]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === formServiceId),
    [services, formServiceId]
  );

  const availableStaffForService = useMemo(() => {
    if (!selectedService) return [];
    return staff.filter((s) => selectedService.assignableStaff.includes(s.id));
  }, [selectedService, staff]);

  function goToToday() {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }

  function resetForm() {
    setFormClientId('');
    setFormServiceId('');
    setFormStaffId('');
    setFormDate('');
    setFormTime('');
    setFormNotes('');
  }

  function handleCreateBooking() {
    if (!formClientId || !formServiceId || !formStaffId || !formDate || !formTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const service = services.find((s) => s.id === formServiceId);
    if (!service) return;

    const startDateTime = parseISO(`${formDate}T${formTime}`);
    const endDateTime = addMinutes(startDateTime, service.duration);
    const endTime = format(endDateTime, 'HH:mm');

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      clientId: formClientId,
      staffId: formStaffId,
      serviceId: formServiceId,
      date: formDate,
      time: formTime,
      endTime,
      status: 'confirmed',
      notes: formNotes,
      createdAt: new Date().toISOString(),
    };

    addBooking(newBooking);
    toast.success('Booking created successfully');
    setCreateDialogOpen(false);
    resetForm();
  }

  function handleCancelBooking(id: string) {
    cancelBooking(id);
    toast.success('Booking cancelled');
    setSelectedBooking(null);
  }

  function handleCompleteBooking(id: string) {
    updateBooking(id, { status: 'completed' });
    toast.success('Booking marked as completed');
    setSelectedBooking(null);
  }

  function getStaffName(staffId: string) {
    return staff.find((s) => s.id === staffId)?.name ?? 'Unknown';
  }

  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name ?? 'Unknown';
  }

  function getServiceName(serviceId: string) {
    return services.find((s) => s.id === serviceId)?.name ?? 'Unknown';
  }

  function getServiceById(serviceId: string) {
    return services.find((s) => s.id === serviceId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Manage all appointments and schedules"
        action={
          <Button
            onClick={() => {
              resetForm();
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterStaff} onValueChange={(v) => setFilterStaff(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterService} onValueChange={(v) => setFilterService(v ?? 'all')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          {format(weekDays[0], 'MMM d')} &ndash; {format(weekDays[6], 'MMM d, yyyy')}
        </h2>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDay[key] || [];
          const today = isToday(day);

          return (
            <Card
              key={key}
              className={`min-h-[180px] ${
                today ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  <span className="block text-center">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`block text-center text-lg font-bold ${
                      today
                        ? 'text-primary'
                        : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-1.5">
                {dayBookings.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No bookings
                  </p>
                ) : (
                  dayBookings.map((booking) => {
                    const color = getStaffColor(booking.staffId, allStaffIds);
                    const staffMember = staff.find(
                      (s) => s.id === booking.staffId
                    );
                    return (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className={`w-full text-left rounded-md border p-2 text-xs transition-shadow hover:shadow-md cursor-pointer ${color.bg} ${color.border}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-semibold ${color.text}`}>
                            {booking.time}
                          </span>
                          {staffMember && (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1 py-0 ${color.text}`}
                            >
                              {getInitials(staffMember.name)}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium truncate mt-0.5">
                          {getServiceName(booking.serviceId)}
                        </p>
                        <p className="text-muted-foreground truncate">
                          {getClientName(booking.clientId)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={booking.status} />
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Booking Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={formClientId} onValueChange={(v) => setFormClientId(v ?? '')}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={formServiceId}
                onValueChange={(val) => {
                  setFormServiceId(val ?? '');
                  setFormStaffId('');
                }}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services
                    .filter((s) => s.isActive)
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.duration}min - ${s.price})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Staff</Label>
              <Select value={formStaffId} onValueChange={(v) => setFormStaffId(v ?? '')}>
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaffForService.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formServiceId && availableStaffForService.length === 0 && (
                <p className="text-xs text-destructive">
                  No staff assigned to this service.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special requests or notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateBooking}>Create Booking</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Booking Dialog */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        {selectedBooking && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                View and manage this appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {getClientName(selectedBooking.clientId)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Staff</p>
                  <p className="font-medium">
                    {getStaffName(selectedBooking.staffId)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">
                    {getServiceName(selectedBooking.serviceId)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedBooking.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(parseISO(selectedBooking.date), 'EEEE, MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {selectedBooking.time} &ndash; {selectedBooking.endTime}
                  </p>
                </div>
              </div>

              {(() => {
                const svc = getServiceById(selectedBooking.serviceId);
                return svc ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{svc.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">${svc.price}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-0.5">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                {selectedBooking.status !== 'cancelled' &&
                  selectedBooking.status !== 'completed' && (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleCancelBooking(selectedBooking.id)
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </Button>
                      <Button
                        onClick={() =>
                          handleCompleteBooking(selectedBooking.id)
                        }
                      >
                        Mark Complete
                      </Button>
                    </>
                  )}
                {(selectedBooking.status === 'cancelled' ||
                  selectedBooking.status === 'completed') && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
