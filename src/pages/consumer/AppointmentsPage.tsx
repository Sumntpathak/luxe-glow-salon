

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, parseISO, isAfter, addHours, addMinutes, parse, isBefore, isToday } from 'date-fns';
import {
  CalendarDays,
  Clock,
  X,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Booking } from '@/types';
import toast from 'react-hot-toast';

export default function AppointmentsPage() {
  const { bookings, services, staff, currentUser, cancelBooking, updateBooking } = useStore();

  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter((b) => b.clientId === currentUser.id);
  }, [bookings, currentUser]);

  const now = new Date();

  const upcomingBookings = useMemo(() => {
    return myBookings
      .filter((b) => {
        const bookingDate = parseISO(`${b.date}T${b.time}`);
        return isAfter(bookingDate, now) && b.status !== 'cancelled' && b.status !== 'completed';
      })
      .sort((a, b) => {
        const da = parseISO(`${a.date}T${a.time}`);
        const db = parseISO(`${b.date}T${b.time}`);
        return da.getTime() - db.getTime();
      });
  }, [myBookings, now]);

  const pastBookings = useMemo(() => {
    return myBookings
      .filter((b) => {
        const bookingDate = parseISO(`${b.date}T${b.time}`);
        return !isAfter(bookingDate, now) || b.status === 'cancelled' || b.status === 'completed';
      })
      .sort((a, b) => {
        const da = parseISO(`${a.date}T${a.time}`);
        const db = parseISO(`${b.date}T${b.time}`);
        return db.getTime() - da.getTime();
      });
  }, [myBookings, now]);

  const canCancel = (booking: Booking) => {
    if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;
    const bookingDate = parseISO(`${booking.date}T${booking.time}`);
    return isAfter(bookingDate, addHours(new Date(), 24));
  };

  const handleCancel = (id: string) => {
    cancelBooking(id);
    toast.success('Booking cancelled successfully');
  };

  const getService = (id: string) => services.find((s) => s.id === id);
  const getStaff = (id: string) => staff.find((s) => s.id === id);

  const generateICS = (booking: Booking) => {
    const service = getService(booking.serviceId);
    const staffMember = getStaff(booking.staffId);
    const startDate = parseISO(`${booking.date}T${booking.time}:00`);
    const endDate = parseISO(`${booking.date}T${booking.endTime}:00`);

    const formatICSDate = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Luxe Glow Salon//Booking//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${service?.name || 'Salon Appointment'}`,
      `DESCRIPTION:${service?.name || 'Service'} with ${staffMember?.name || 'Stylist'}`,
      'LOCATION:Luxe Glow Salon',
      `UID:${booking.id}@luxeglowsalon.com`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Calendar file downloaded');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Appointments"
        description="View and manage your upcoming and past bookings"
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming appointments"
              description="You don't have any upcoming bookings. Book a service to get started!"
              action={
                <a href="/consumer/book">
                  <Button>Book Now</Button>
                </a>
              }
            />
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  service={getService(booking.serviceId)}
                  staffMember={getStaff(booking.staffId)}
                  canCancel={canCancel(booking)}
                  onCancel={() => handleCancel(booking.id)}
                  onDownloadICS={() => generateICS(booking)}
                  allBookings={bookings}
                  onReschedule={(id, date, time, endTime) => {
                    updateBooking(id, { date, time, endTime });
                    toast.success('Appointment rescheduled');
                  }}
                  serviceDuration={getService(booking.serviceId)?.duration || 30}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastBookings.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No past appointments"
              description="Your appointment history will appear here."
            />
          ) : (
            <div className="space-y-3">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  service={getService(booking.serviceId)}
                  staffMember={getStaff(booking.staffId)}
                  canCancel={false}
                  onCancel={() => {}}
                  onDownloadICS={() => generateICS(booking)}
                  allBookings={bookings}
                  onReschedule={() => {}}
                  serviceDuration={0}
                  isPast
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  service: ReturnType<typeof Array.prototype.find>;
  staffMember: ReturnType<typeof Array.prototype.find>;
  canCancel: boolean;
  onCancel: () => void;
  onDownloadICS: () => void;
  allBookings: Booking[];
  onReschedule: (id: string, date: string, time: string, endTime: string) => void;
  serviceDuration: number;
  isPast?: boolean;
}

function BookingCard({
  booking,
  service,
  staffMember,
  canCancel,
  onCancel,
  onDownloadICS,
  allBookings,
  onReschedule,
  serviceDuration,
  isPast,
}: BookingCardProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string | null>(null);

  const availableSlots = useMemo(() => {
    if (!newDate || !staffMember || !serviceDuration) return [];
    const dateStr = format(newDate, 'yyyy-MM-dd');
    const staffBookings = allBookings.filter(
      (b) =>
        b.staffId === booking.staffId &&
        b.date === dateStr &&
        b.status !== 'cancelled' &&
        b.id !== booking.id
    );

    const slots: string[] = [];
    const now = new Date();

    for (let h = 9; h < 17; h++) {
      for (const m of [0, 30]) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const slotStart = parse(timeStr, 'HH:mm', newDate);
        const slotEnd = addMinutes(slotStart, serviceDuration);
        const slotEndTime = format(slotEnd, 'HH:mm');

        if (isToday(newDate) && isBefore(slotStart, now)) continue;
        if (slotEnd.getHours() > 17 || (slotEnd.getHours() === 17 && slotEnd.getMinutes() > 0)) continue;

        const hasConflict = staffBookings.some((b) => {
          return timeStr < b.endTime && slotEndTime > b.time;
        });

        if (!hasConflict) slots.push(timeStr);
      }
    }
    return slots;
  }, [newDate, staffMember, serviceDuration, allBookings, booking.staffId, booking.id]);

  const handleReschedule = () => {
    if (!newDate || !newTime) return;
    const slotStart = parse(newTime, 'HH:mm', newDate);
    const slotEnd = addMinutes(slotStart, serviceDuration);
    onReschedule(
      booking.id,
      format(newDate, 'yyyy-MM-dd'),
      newTime,
      format(slotEnd, 'HH:mm')
    );
    setRescheduleOpen(false);
    setNewDate(undefined);
    setNewTime(null);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={staffMember?.avatar} alt={staffMember?.name} />
              <AvatarFallback>
                {staffMember?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{service?.name || 'Unknown Service'}</h3>
              <p className="text-sm text-muted-foreground">
                with {staffMember?.name || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(parseISO(booking.date), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {booking.time} - {booking.endTime}
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {!isPast && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={onDownloadICS}>
                <Download className="h-3.5 w-3.5 mr-1" />
                .ics
              </Button>

              {canCancel && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Reschedule
                  </Button>
                  <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Calendar
                            mode="single"
                            selected={newDate}
                            onSelect={(d) => {
                              setNewDate(d);
                              setNewTime(null);
                            }}
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </div>
                        {newDate && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Available times for {format(newDate, 'MMM d, yyyy')}
                            </p>
                            {availableSlots.length > 0 ? (
                              <div className="grid grid-cols-4 gap-2">
                                {availableSlots.map((slot) => (
                                  <Button
                                    key={slot}
                                    variant={newTime === slot ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setNewTime(slot)}
                                  >
                                    {slot}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No available slots.</p>
                            )}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
                            Cancel
                          </Button>
                          <Button disabled={!newDate || !newTime} onClick={handleReschedule}>
                            Confirm Reschedule
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="destructive" size="sm" onClick={onCancel}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
