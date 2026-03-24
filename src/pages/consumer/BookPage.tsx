

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format, addMinutes, parse, isBefore, isToday } from 'date-fns';
import { Search, Clock, DollarSign, Star, ChevronLeft, Check, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Service, Staff } from '@/types';
import toast from 'react-hot-toast';

type Category = 'All' | 'Hair' | 'Nails' | 'Skin';

export default function BookServicePage() {
  const { services, staff, bookings, addBooking, currentUser } = useStore();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const categories: Category[] = ['All', 'Hair', 'Nails', 'Skin'];

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!s.isActive) return false;
      if (category !== 'All' && s.category !== category) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [services, category, search]);

  const availableStaff = useMemo(() => {
    if (!selectedService) return [];
    return staff.filter((s) => selectedService.assignableStaff.includes(s.id) && s.isActive);
  }, [selectedService, staff]);

  const availableSlots = useMemo(() => {
    if (!selectedStaff || !selectedDate || !selectedService) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const staffBookings = bookings.filter(
      (b) => b.staffId === selectedStaff.id && b.date === dateStr && b.status !== 'cancelled'
    );

    const slots: string[] = [];
    const startHour = 9;
    const endHour = 17;
    const now = new Date();

    for (let h = startHour; h < endHour; h++) {
      for (const m of [0, 30]) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const slotStart = parse(timeStr, 'HH:mm', selectedDate);
        const slotEnd = addMinutes(slotStart, selectedService.duration);
        const slotEndTime = format(slotEnd, 'HH:mm');

        // Don't allow past times today
        if (isToday(selectedDate) && isBefore(slotStart, now)) continue;

        // Check if end time exceeds working hours
        if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)) continue;

        // Check conflicts with existing bookings
        const hasConflict = staffBookings.some((b) => {
          return timeStr < b.endTime && slotEndTime > b.time;
        });

        if (!hasConflict) {
          slots.push(timeStr);
        }
      }
    }
    return slots;
  }, [selectedStaff, selectedDate, selectedService, bookings]);

  const handleConfirm = () => {
    if (!currentUser || !selectedService || !selectedStaff || !selectedDate || !selectedTime) return;

    const slotStart = parse(selectedTime, 'HH:mm', selectedDate);
    const slotEnd = addMinutes(slotStart, selectedService.duration);

    const booking = {
      id: `bk-${Date.now()}`,
      clientId: currentUser.id,
      staffId: selectedStaff.id,
      serviceId: selectedService.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      endTime: format(slotEnd, 'HH:mm'),
      status: 'confirmed' as const,
      notes,
      createdAt: new Date().toISOString(),
    };

    addBooking(booking);
    toast.success('Booking confirmed! See you soon.');

    // Reset
    setStep(1);
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setNotes('');
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book a Service"
        description="Choose a service, stylist, and time that works for you"
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {['Service', 'Stylist', 'Date & Time', 'Confirm'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step > i + 1
                  ? 'bg-green-500 text-white'
                  : step === i + 1
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${step === i + 1 ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < 3 && <Separator className="w-8" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
              >
                <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                  {service.photoUrl ? (
                    <img
                      src={service.photoUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {service.category}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration} min
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <DollarSign className="h-3.5 w-3.5" />
                      {service.price}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Stylist */}
      {step === 2 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <p className="text-sm text-muted-foreground">
            Choose a stylist for <strong>{selectedService?.name}</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableStaff.map((member) => (
              <Card
                key={member.id}
                className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => {
                  setSelectedStaff(member);
                  setStep(3);
                }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{member.bio}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{member.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {member.specialties.slice(0, 3).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Select Date & Time */}
      {step === 3 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <p className="text-sm text-muted-foreground">
            Pick a date and time for <strong>{selectedService?.name}</strong> with{' '}
            <strong>{selectedStaff?.name}</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Date</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Time</CardTitle>
                <CardDescription>
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Choose a date first'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTime(slot)}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No available slots on this date. Try another date.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Please select a date to view available times.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any special requests or preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(4)}
            >
              Continue to Confirmation
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
              <CardDescription>Please review your booking details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedService?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium">${selectedService?.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stylist</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedStaff?.avatar} />
                      <AvatarFallback>{selectedStaff?.name?.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{selectedStaff?.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedService?.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedTime}</p>
                </div>
              </div>
              {notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{notes}</p>
                </div>
              )}
              <Separator />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Confirm Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
