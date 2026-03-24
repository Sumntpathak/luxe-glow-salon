import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  ArrowLeft, ArrowRight, Check, Clock, Star, Sparkles,
  Sun, Moon, User, Mail, Phone,
} from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';

type Step = 1 | 2 | 3 | 4 | 5;

export default function PublicBookPage() {
  const location = useLocation();
  const preselectedServiceId = (location.state as { serviceId?: string } | null)?.serviceId;
  const { services, staff, bookings, addBooking, salonSettings, darkMode, toggleDarkMode } = useStore();

  const [step, setStep] = useState<Step>(1);
  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || '');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [confirmed, setConfirmed] = useState(false);

  const activeServices = services.filter(s => s.isActive);
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedStaff = staff.find(s => s.id === selectedStaffId);

  const availableStaff = useMemo(() => {
    if (!selectedService) return [];
    return staff.filter(s => s.isActive && selectedService.assignableStaff.includes(s.id));
  }, [selectedService, staff]);

  const categories = ['All', ...Array.from(new Set(activeServices.map(s => s.category)))];
  const filtered = filterCat === 'All' ? activeServices : activeServices.filter(s => s.category === filterCat);

  const minDate = addDays(new Date(), Math.ceil(salonSettings.bookingRules.minAdvanceHours / 24));
  const maxDate = addDays(new Date(), salonSettings.bookingRules.maxFutureDays);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedStaffId || !selectedService) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayKey = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof salonSettings.workingHours;
    const dayHours = salonSettings.workingHours[dayKey];
    if (!dayHours.isOpen) return [];

    const [openH, openM] = dayHours.open.split(':').map(Number);
    const [closeH, closeM] = dayHours.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    const dayBookings = bookings.filter(
      b => b.staffId === selectedStaffId && b.date === dateStr && b.status !== 'cancelled'
    );

    const slots: string[] = [];
    for (let m = openMin; m + selectedService.duration <= closeMin; m += 30) {
      const slotStart = m;
      const slotEnd = m + selectedService.duration;
      const h = String(Math.floor(m / 60)).padStart(2, '0');
      const min = String(m % 60).padStart(2, '0');
      const timeStr = `${h}:${min}`;

      const conflict = dayBookings.some(b => {
        const [bh, bm] = b.time.split(':').map(Number);
        const [eh, em] = b.endTime.split(':').map(Number);
        const bStart = bh * 60 + bm;
        const bEnd = eh * 60 + em;
        return slotStart < bEnd && slotEnd > bStart;
      });
      if (!conflict) slots.push(timeStr);
    }
    return slots;
  }, [selectedDate, selectedStaffId, selectedService, bookings, salonSettings]);

  const handleConfirm = () => {
    if (!selectedService || !selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const [h, m] = selectedTime.split(':').map(Number);
    const endMin = h * 60 + m + selectedService.duration;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    addBooking({
      id: `bk-${Date.now()}`,
      clientId: `guest-${Date.now()}`,
      staffId: selectedStaffId,
      serviceId: selectedServiceId,
      date: dateStr,
      time: selectedTime,
      endTime,
      status: 'confirmed',
      notes: `Guest: ${guestName} (${guestEmail}, ${guestPhone}). ${notes}`,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    });
    setConfirmed(true);
    toast.success('Booking confirmed!');
  };

  const stepTitles = ['Service', 'Stylist', 'Date & Time', 'Your Details', 'Confirm'];

  const categoryColors: Record<string, string> = {
    Hair: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    Nails: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    Skin: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  };

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold">You're All Set!</h2>
          <p className="text-muted-foreground mt-2">
            Your appointment for <strong>{selectedService?.name}</strong> with <strong>{selectedStaff?.name}</strong> on{' '}
            <strong>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}</strong> at <strong>{selectedTime}</strong> is confirmed.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            A confirmation has been sent to <strong>{guestEmail}</strong>.
          </p>
          <div className="mt-8 flex flex-col gap-2">
            <Link to="/">
              <Button className="w-full rounded-full">Back to Home</Button>
            </Link>
            <Link to="/my-bookings">
              <Button variant="outline" className="w-full rounded-full">View My Bookings</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="border-b bg-card/80 glass sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span className="font-semibold text-sm">Book Appointment</span>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full h-8 w-8">
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {stepTitles.map((title, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ease-out ${i + 1 <= step ? 'bg-gradient-to-r from-primary to-accent w-full' : 'w-0'}`} />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide uppercase ${i + 1 <= step ? 'text-primary' : 'text-muted-foreground/50'} hidden sm:block`}>
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Service */}
        {step === 1 && (
          <div className="section-fade">
            <h2 className="text-2xl font-bold mb-2">Choose a Service</h2>
            <p className="text-muted-foreground mb-6">Select the treatment you'd like to book.</p>
            <div className="flex gap-2 mb-6 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filterCat === cat ? 'bg-primary text-primary-foreground' : 'bg-card border hover:border-primary/30 text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(svc => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedServiceId(svc.id); setStep(2); setSelectedStaffId(''); }}
                  className={`p-4 rounded-xl border text-left transition-all hover:shadow-md ${
                    selectedServiceId === svc.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="secondary" className={`text-[10px] mb-2 ${categoryColors[svc.category] || ''}`}>
                        {svc.category}
                      </Badge>
                      <h3 className="font-semibold">{svc.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{svc.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-lg font-bold">${svc.price}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />{svc.duration}min
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Stylist */}
        {step === 2 && (
          <div className="section-fade">
            <h2 className="text-2xl font-bold mb-2">Choose Your Stylist</h2>
            <p className="text-muted-foreground mb-6">Pick who you'd like to see for your {selectedService?.name}.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availableStaff.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaffId(s.id); setStep(3); }}
                  className={`p-5 rounded-xl border text-left transition-all hover:shadow-md flex gap-4 items-center ${
                    selectedStaffId === s.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden ring-2 ring-border shrink-0">
                    <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-muted-foreground">{s.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.bio}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep(1)} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className="section-fade">
            <h2 className="text-2xl font-bold mb-1">Pick a Date & Time</h2>
            <p className="text-muted-foreground mb-8">Select when you'd like your appointment.</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8">
              {/* Calendar */}
              <div>
                <Card className="p-2 sm:p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d ?? undefined); setSelectedTime(''); }}
                    disabled={(d) => isBefore(d, startOfDay(minDate)) || isBefore(maxDate, d)}
                  />
                </Card>
              </div>
              {/* Time slots */}
              <div>
                {selectedDate ? (
                  <div className="section-fade">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{format(selectedDate, 'EEEE')}</h3>
                        <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                    {availableSlots.length === 0 ? (
                      <Card className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">No available slots on this day. Try another date.</p>
                      </Card>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Available times</p>
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map(time => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                selectedTime === time
                                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]'
                                  : 'bg-card border border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm text-foreground'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {selectedTime && (
                      <Button className="mt-8 rounded-full w-full h-11 text-sm glow-pink" onClick={() => setStep(4)}>
                        Continue <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-dashed">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Select a date</p>
                    <p className="text-xs text-muted-foreground mt-1">Pick a day on the calendar to see available time slots.</p>
                  </Card>
                )}
              </div>
            </div>
            <Button variant="ghost" onClick={() => setStep(2)} className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        )}

        {/* Step 4: Guest details */}
        {step === 4 && (
          <div className="section-fade max-w-md">
            <h2 className="text-2xl font-bold mb-2">Your Details</h2>
            <p className="text-muted-foreground mb-6">No account needed. Just tell us how to reach you.</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-1.5"><User className="h-3.5 w-3.5" /> Full Name</Label>
                <Input id="name" placeholder="Jane Doe" value={guestName} onChange={e => setGuestName(e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                <Input id="email" type="email" placeholder="jane@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
                <Input id="phone" type="tel" placeholder="+1 555 000 0000" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="rounded-lg" />
              </div>
              <div>
                <Label htmlFor="notes" className="mb-1.5">Special Requests (optional)</Label>
                <Textarea id="notes" placeholder="Any allergies, preferences..." value={notes} onChange={e => setNotes(e.target.value)} className="rounded-lg" rows={3} />
              </div>
            </div>
            <Button
              className="mt-6 rounded-full w-full"
              disabled={!guestName || !guestEmail || !guestPhone}
              onClick={() => setStep(5)}
            >
              Review Booking <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="ghost" onClick={() => setStep(3)} className="mt-2 w-full">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="section-fade max-w-md">
            <h2 className="text-2xl font-bold mb-2">Confirm Booking</h2>
            <p className="text-muted-foreground mb-6">Review your appointment details below.</p>
            <Card className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Service</p>
                  <p className="font-semibold">{selectedService?.name}</p>
                </div>
                <p className="text-xl font-bold">${selectedService?.price}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stylist</p>
                  <p className="font-medium">{selectedStaff?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
                  <p className="font-medium">{selectedService?.duration} min</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
                  <p className="font-medium">{selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Time</p>
                  <p className="font-medium">{selectedTime}</p>
                </div>
              </div>
              <div className="pt-4 border-t text-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Booked By</p>
                <p className="font-medium">{guestName}</p>
                <p className="text-muted-foreground">{guestEmail} &middot; {guestPhone}</p>
              </div>
            </Card>
            <Button className="mt-6 rounded-full w-full h-12 text-base font-semibold" onClick={handleConfirm}>
              <Sparkles className="h-4 w-4 mr-2" /> Confirm Appointment
            </Button>
            <Button variant="ghost" onClick={() => setStep(4)} className="mt-2 w-full">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
