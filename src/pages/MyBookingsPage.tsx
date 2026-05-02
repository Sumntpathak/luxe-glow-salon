import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  ArrowLeft, Mail, Search, Calendar, Clock, User,
  Sun, Moon, Sparkles,
} from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';

export default function MyBookingsPage() {
  const { bookings, services, staff, clients, darkMode, toggleDarkMode } = useStore();
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  const client = useMemo(() => {
    if (!searchEmail) return null;
    return clients.find(c => c.email.toLowerCase() === searchEmail.toLowerCase()) || null;
  }, [searchEmail, clients]);

  const guestBookings = useMemo(() => {
    if (!searchEmail) return [];
    // Search in both client bookings and guest bookings (notes contain email)
    const emailLower = searchEmail.toLowerCase();
    return bookings.filter(b => {
      if (client && b.clientId === client.id) return true;
      return b.notes.toLowerCase().includes(emailLower);
    }).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [searchEmail, bookings, client, clients]);

  const today = startOfDay(new Date());
  const upcoming = guestBookings.filter(b => !isBefore(parseISO(b.date), today) && b.status !== 'cancelled');
  const past = guestBookings.filter(b => isBefore(parseISO(b.date), today) || b.status === 'cancelled');

  const serviceMap = Object.fromEntries(services.map(s => [s.id, s]));
  const staffMap = Object.fromEntries(staff.map(s => [s.id, s]));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="border-b bg-card/80 glass sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <span className="font-semibold text-sm">My Bookings</span>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full h-8 w-8">
            {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {!searchEmail ? (
          <div className="section-fade max-w-sm mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">View Your Bookings</h1>
            <p className="text-muted-foreground mt-2 mb-8">
              Enter the email you used when booking to see your appointments.
            </p>
            <form onSubmit={e => { e.preventDefault(); setSearchEmail(email); }} className="space-y-3">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-full text-center h-12"
              />
              <Button type="submit" disabled={!email} className="rounded-full w-full h-11">
                <Search className="h-4 w-4 mr-2" /> Find My Bookings
              </Button>
            </form>
          </div>
        ) : (
          <div className="section-fade">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold">
                  {client ? `Welcome back, ${client.name.split(' ')[0]}` : 'Your Bookings'}
                </h1>
                <p className="text-sm text-muted-foreground">{searchEmail}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setSearchEmail(''); setEmail(''); }}>
                Change
              </Button>
            </div>

            {guestBookings.length === 0 ? (
              <Card className="p-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No bookings found</p>
                <p className="text-sm text-muted-foreground mt-1">We couldn't find any bookings with this email.</p>
                <Link to="/book">
                  <Button className="mt-4 rounded-full">Book an Appointment</Button>
                </Link>
              </Card>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Upcoming</h3>
                    <div className="space-y-3">
                      {upcoming.map(b => {
                        const svc = serviceMap[b.serviceId];
                        const stf = staffMap[b.staffId];
                        return (
                          <Card key={b.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{svc?.name || 'Service'}</h4>
                                  <StatusBadge status={b.status} />
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(b.date), 'MMM d, yyyy')}</span>
                                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.time} - {b.endTime}</span>
                                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{stf?.name || 'Staff'}</span>
                                </div>
                              </div>
                              <p className="text-lg font-bold ml-4">${svc?.price || 0}</p>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {past.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Past</h3>
                    <div className="space-y-3">
                      {past.map(b => {
                        const svc = serviceMap[b.serviceId];
                        const stf = staffMap[b.staffId];
                        return (
                          <Card key={b.id} className="p-4 opacity-70">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{svc?.name || 'Service'}</h4>
                                  <StatusBadge status={b.status} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(b.date), 'MMM d, yyyy')} at {b.time} with {stf?.name || 'Staff'}
                                </p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-8 text-center">
                  <Link to="/book">
                    <Button className="rounded-full px-8">
                      <Sparkles className="h-4 w-4 mr-2" /> Book Another Appointment
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
