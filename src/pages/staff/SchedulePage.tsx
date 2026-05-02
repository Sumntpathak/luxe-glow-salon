

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Clock, CalendarOff, X, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { WorkingHours, DayHours } from '@/types';

const DAYS: { key: keyof WorkingHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const defaultDayHours: DayHours = { isOpen: false, open: '09:00', close: '17:00' };

export default function StaffSchedulePage() {
  const { currentUser, staff, bookings, services, clients, updateStaff } = useStore();

  const staffMember = staff.find((s) => s.id === currentUser?.id);

  const [workingHours, setWorkingHours] = useState<WorkingHours>(
    staffMember?.workingHours ?? {
      monday: { ...defaultDayHours },
      tuesday: { ...defaultDayHours },
      wednesday: { ...defaultDayHours },
      thursday: { ...defaultDayHours },
      friday: { ...defaultDayHours },
      saturday: { ...defaultDayHours },
      sunday: { ...defaultDayHours },
    }
  );

  const [blockedDates, setBlockedDates] = useState<string[]>(
    staffMember?.blockedDates ?? []
  );

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (staffMember) {
      setWorkingHours(staffMember.workingHours);
      setBlockedDates(staffMember.blockedDates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffMember?.id]);

  const updateDay = (day: keyof WorkingHours, field: keyof DayHours, value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveHours = () => {
    if (!staffMember) return;
    updateStaff(staffMember.id, { workingHours });
    toast.success('Working hours saved successfully');
  };

  const handleAddBlockedDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!blockedDates.includes(dateStr)) {
      setBlockedDates((prev) => [...prev, dateStr].sort());
    }
    setSelectedDate(date);
  };

  const handleRemoveBlockedDate = (dateStr: string) => {
    setBlockedDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const handleSaveBlockedDates = () => {
    if (!staffMember) return;
    updateStaff(staffMember.id, { blockedDates });
    toast.success('Blocked dates saved successfully');
  };

  // Get upcoming bookings for this staff member
  const upcomingBookings = bookings
    .filter(
      (b) =>
        b.staffId === currentUser?.id &&
        b.status !== 'cancelled' &&
        b.date >= format(new Date(), 'yyyy-MM-dd')
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const getServiceName = (serviceId: string) =>
    services.find((s) => s.id === serviceId)?.name ?? 'Unknown Service';

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.name ?? 'Unknown Client';

  if (!staffMember) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Staff member not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Schedule"
        description="Manage your working hours, blocked dates, and view upcoming shifts"
      />

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS.map(({ key, label }) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b last:border-b-0"
              >
                <div className="w-28 font-medium text-sm">{label}</div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={workingHours[key].isOpen}
                    onCheckedChange={(checked) => updateDay(key, 'isOpen', checked)}
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {workingHours[key].isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                {workingHours[key].isOpen && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={workingHours[key].open}
                      onChange={(e) => updateDay(key, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={workingHours[key].close}
                      onChange={(e) => updateDay(key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveHours}>
              <Save className="h-4 w-4 mr-2" />
              Save Hours
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Blocked Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleAddBlockedDate}
              />
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select dates on the calendar to block them. Clients will not be able to book
                appointments on blocked dates.
              </p>
              <Separator />
              {blockedDates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No blocked dates</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((dateStr) => (
                    <Badge key={dateStr} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      {format(parseISO(dateStr), 'MMM d, yyyy')}
                      <button
                        onClick={() => handleRemoveBlockedDate(dateStr)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveBlockedDates}>
              <Save className="h-4 w-4 mr-2" />
              Save Blocked Dates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Shifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No upcoming bookings</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b last:border-b-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{getServiceName(booking.serviceId)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getClientName(booking.clientId)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">
                      {format(parseISO(booking.date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.time} - {booking.endTime}
                    </p>
                  </div>
                  <Badge
                    variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                  >
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
