

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Save, Building, Clock, BookOpen, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { WorkingHours } from '@/types';

const DAYS: { key: keyof WorkingHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function AdminSettingsPage() {
  const { salonSettings, updateSalonSettings } = useStore();

  // Salon Info state
  const [name, setName] = useState(salonSettings.name);
  const [address, setAddress] = useState(salonSettings.address);
  const [phone, setPhone] = useState(salonSettings.phone);
  const [logoUrl, setLogoUrl] = useState(salonSettings.logoUrl);

  // Working Hours state
  const [workingHours, setWorkingHours] = useState<WorkingHours>(salonSettings.workingHours);

  // Booking Rules state
  const [minAdvanceHours, setMinAdvanceHours] = useState(salonSettings.bookingRules.minAdvanceHours);
  const [maxFutureDays, setMaxFutureDays] = useState(salonSettings.bookingRules.maxFutureDays);
  const [cancellationWindowHours, setCancellationWindowHours] = useState(salonSettings.bookingRules.cancellationWindowHours);

  // Notification Templates state (local only)
  const [bookingConfirmation, setBookingConfirmation] = useState(
    'Hi {name}, your appointment for {service} on {date} at {time} is confirmed!'
  );
  const [appointmentReminder, setAppointmentReminder] = useState(
    'Reminder: Your {service} appointment is tomorrow at {time}. See you soon!'
  );
  const [reviewRequest, setReviewRequest] = useState(
    'Hi {name}, thank you for visiting! We\'d love your feedback on your recent {service}.'
  );

  // Sync state when store changes
  useEffect(() => {
    setName(salonSettings.name);
    setAddress(salonSettings.address);
    setPhone(salonSettings.phone);
    setLogoUrl(salonSettings.logoUrl);
    setWorkingHours(salonSettings.workingHours);
    setMinAdvanceHours(salonSettings.bookingRules.minAdvanceHours);
    setMaxFutureDays(salonSettings.bookingRules.maxFutureDays);
    setCancellationWindowHours(salonSettings.bookingRules.cancellationWindowHours);
  }, [salonSettings]);

  const handleSaveSalonInfo = () => {
    updateSalonSettings({ name, address, phone, logoUrl });
    toast.success('Salon information saved successfully!');
  };

  const handleSaveWorkingHours = () => {
    updateSalonSettings({ workingHours });
    toast.success('Working hours saved successfully!');
  };

  const handleSaveBookingRules = () => {
    updateSalonSettings({
      bookingRules: { minAdvanceHours, maxFutureDays, cancellationWindowHours },
    });
    toast.success('Booking rules saved successfully!');
  };

  const handleSaveTemplates = () => {
    toast.success('Notification templates saved successfully!');
  };

  const updateDayHours = (day: keyof WorkingHours, field: string, value: string | boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your salon configuration and preferences"
      />

      <Tabs defaultValue="salon-info">
        <TabsList className="w-full flex-wrap h-auto gap-1">
          <TabsTrigger value="salon-info" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Salon Info
          </TabsTrigger>
          <TabsTrigger value="working-hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Working Hours
          </TabsTrigger>
          <TabsTrigger value="booking-rules" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Booking Rules
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Salon Info Tab */}
        <TabsContent value="salon-info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Salon Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="salon-name">Salon Name</Label>
                  <Input
                    id="salon-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter salon name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter salon address"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input
                    id="logo-url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Enter logo URL"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveSalonInfo} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Hours Tab */}
        <TabsContent value="working-hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Day</th>
                      <th className="p-3 text-left font-medium">Open</th>
                      <th className="p-3 text-left font-medium">Opening Time</th>
                      <th className="p-3 text-left font-medium">Closing Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(({ key, label }) => (
                      <tr key={key} className="border-b last:border-b-0">
                        <td className="p-3 font-medium">{label}</td>
                        <td className="p-3">
                          <Switch
                            checked={workingHours[key].isOpen}
                            onCheckedChange={(checked) =>
                              updateDayHours(key, 'isOpen', checked)
                            }
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="time"
                            value={workingHours[key].open}
                            onChange={(e) => updateDayHours(key, 'open', e.target.value)}
                            disabled={!workingHours[key].isOpen}
                            className="w-36"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="time"
                            value={workingHours[key].close}
                            onChange={(e) => updateDayHours(key, 'close', e.target.value)}
                            disabled={!workingHours[key].isOpen}
                            className="w-36"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveWorkingHours} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Rules Tab */}
        <TabsContent value="booking-rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Booking Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="min-advance">Minimum Advance Hours</Label>
                  <Input
                    id="min-advance"
                    type="number"
                    min={0}
                    value={minAdvanceHours}
                    onChange={(e) => setMinAdvanceHours(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    How far in advance clients must book
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-future">Maximum Future Days</Label>
                  <Input
                    id="max-future"
                    type="number"
                    min={1}
                    value={maxFutureDays}
                    onChange={(e) => setMaxFutureDays(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    How far ahead clients can book
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancel-window">Cancellation Window (hours)</Label>
                  <Input
                    id="cancel-window"
                    type="number"
                    min={0}
                    value={cancellationWindowHours}
                    onChange={(e) => setCancellationWindowHours(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Hours before appointment when cancellation is allowed
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveBookingRules} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Templates Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Customize the messages sent to clients. Use placeholders like{' '}
                <code className="bg-muted px-1 rounded">{'{name}'}</code>,{' '}
                <code className="bg-muted px-1 rounded">{'{service}'}</code>,{' '}
                <code className="bg-muted px-1 rounded">{'{date}'}</code>, and{' '}
                <code className="bg-muted px-1 rounded">{'{time}'}</code>.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="booking-confirmation">Booking Confirmation</Label>
                  <Textarea
                    id="booking-confirmation"
                    rows={3}
                    value={bookingConfirmation}
                    onChange={(e) => setBookingConfirmation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-reminder">Appointment Reminder</Label>
                  <Textarea
                    id="appointment-reminder"
                    rows={3}
                    value={appointmentReminder}
                    onChange={(e) => setAppointmentReminder(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-request">Review Request</Label>
                  <Textarea
                    id="review-request"
                    rows={3}
                    value={reviewRequest}
                    onChange={(e) => setReviewRequest(e.target.value)}
                  />
                </div>
              </div>

              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveTemplates} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
