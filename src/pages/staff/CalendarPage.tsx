

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Heart,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
  addWeeks,
  subWeeks,
} from 'date-fns';
import toast from 'react-hot-toast';
import { Booking } from '@/types';

const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const hour = 9 + i;
  return {
    label: format(new Date(2000, 0, 1, hour), 'h:mm a'),
    hour,
    time: `${String(hour).padStart(2, '0')}:00`,
  };
});

export default function StaffCalendarPage() {
  const { currentUser, bookings, clients, services, updateBooking } = useStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter(
      (b) => b.staffId === currentUser.id && b.status !== 'cancelled'
    );
  }, [bookings, currentUser]);

  const dayBookings = useMemo(() => {
    return myBookings
      .filter((b) => isSameDay(parseISO(b.date), selectedDate))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [myBookings, selectedDate]);

  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    });
  }, [currentWeekStart]);

  const weekBookingsMap = useMemo(() => {
    const map = new Map<string, Booking[]>();
    weekDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayItems = myBookings
        .filter((b) => b.date === dateStr)
        .sort((a, b) => a.time.localeCompare(b.time));
      map.set(dateStr, dayItems);
    });
    return map;
  }, [weekDays, myBookings]);

  const getClient = (clientId: string) =>
    clients.find((c) => c.id === clientId);

  const getService = (serviceId: string) =>
    services.find((s) => s.id === serviceId);

  const handleMarkComplete = (bookingId: string) => {
    updateBooking(bookingId, { status: 'completed' });
    toast.success('Appointment marked as completed');
    setSelectedBooking(null);
  };

  const goToPrevWeek = () => setCurrentWeekStart((w) => subWeeks(w, 1));
  const goToNextWeek = () => setCurrentWeekStart((w) => addWeeks(w, 1));
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
  };

  const getBookingsAtHour = (hour: number) => {
    return dayBookings.filter((b) => {
      const bookingHour = parseInt(b.time.split(':')[0], 10);
      return bookingHour === hour;
    });
  };

  function AppointmentCard({ booking }: { booking: Booking }) {
    const client = getClient(booking.clientId);
    const service = getService(booking.serviceId);
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
        onClick={() => setSelectedBooking(booking)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {booking.time} - {booking.endTime}
                </span>
              </div>
              <p className="font-medium truncate">
                {service?.name ?? 'Unknown Service'}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {client?.name ?? 'Unknown Client'}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) return null;

  const selectedClient = selectedBooking
    ? getClient(selectedBooking.clientId)
    : null;
  const selectedService = selectedBooking
    ? getService(selectedBooking.serviceId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Calendar"
        description="View and manage your upcoming appointments"
        action={
          <Button variant="outline" onClick={goToToday}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Today
          </Button>
        }
      />

      <Tabs
        value={viewMode}
        onValueChange={(val) => setViewMode(val as 'day' | 'week')}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="day">Day View</TabsTrigger>
            <TabsTrigger value="week">Week View</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {viewMode === 'day'
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day View */}
        <TabsContent value="day">
          {dayBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No appointments today"
              description="You have no scheduled appointments for this day. Enjoy your free time!"
            />
          ) : (
            <div className="mt-4 space-y-0">
              {TIME_SLOTS.map((slot) => {
                const slotBookings = getBookingsAtHour(slot.hour);
                return (
                  <div
                    key={slot.time}
                    className="flex gap-4 border-t border-border py-2 min-h-[72px]"
                  >
                    <div className="w-20 shrink-0 pt-1 text-sm text-muted-foreground font-medium">
                      {slot.label}
                    </div>
                    <div className="flex-1 space-y-2">
                      {slotBookings.map((booking) => (
                        <AppointmentCard key={booking.id} booking={booking} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Week View */}
        <TabsContent value="week">
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayItems = weekBookingsMap.get(dateStr) ?? [];
              const isSelected = isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <Card
                  key={dateStr}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${today ? 'border-primary' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    setViewMode('day');
                  }}
                >
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span
                        className={`${today ? 'text-primary font-bold' : ''}`}
                      >
                        {format(day, 'EEE')}
                      </span>
                      <span
                        className={`text-lg ${
                          today
                            ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center'
                            : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-1.5">
                    {dayItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No appointments
                      </p>
                    ) : (
                      dayItems.map((booking) => {
                        const service = getService(booking.serviceId);
                        return (
                          <div
                            key={booking.id}
                            className="text-xs p-1.5 rounded bg-primary/10 border border-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                            }}
                          >
                            <p className="font-medium truncate">
                              {booking.time}
                            </p>
                            <p className="truncate text-muted-foreground">
                              {service?.name ?? 'Service'}
                            </p>
                          </div>
                        );
                      })
                    )}
                    {dayItems.length > 0 && (
                      <Badge variant="secondary" className="text-xs w-full justify-center">
                        {dayItems.length} appt{dayItems.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {myBookings.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="No appointments this week"
              description="You have no scheduled appointments for this week."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Appointment Detail Sheet */}
      <Sheet
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null);
        }}
      >
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Appointment Details</SheetTitle>
            <SheetDescription>
              Full details for the selected appointment
            </SheetDescription>
          </SheetHeader>

          {selectedBooking && selectedClient && selectedService && (
            <div className="space-y-6 p-4 pt-0">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <StatusBadge status={selectedBooking.status} />
              </div>

              <Separator />

              {/* Client Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Client Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{selectedClient.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{selectedClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{selectedClient.email}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Service Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Service
                </h4>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{selectedService.name}</p>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">
                      {selectedBooking.time} - {selectedBooking.endTime} (
                      {selectedService.duration} min)
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(selectedBooking.date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Notes */}
              {selectedBooking.notes && (
                <>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Notes
                    </h4>
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm">{selectedBooking.notes}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Allergies */}
              {selectedClient.allergies && (
                <>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Allergies
                    </h4>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive font-medium">
                        {selectedClient.allergies}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Preferences */}
              {selectedClient.preferences && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Preferences
                  </h4>
                  <div className="flex items-start gap-3">
                    <Heart className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm">{selectedClient.preferences}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedBooking.status !== 'completed' && (
                <div className="pt-2">
                  <Button
                    className="w-full"
                    onClick={() => handleMarkComplete(selectedBooking.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
