

import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { KPICard } from '@/components/shared/kpi-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { format, parseISO, isToday, subDays, isWithinInterval, startOfDay } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

export default function AdminDashboardPage() {
  const { bookings, services, clients, staff } = useStore();

  const today = startOfDay(new Date());
  const thirtyDaysAgo = subDays(today, 30);

  const serviceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s])),
    [services],
  );
  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients],
  );
  const staffMap = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s])),
    [staff],
  );

  // --- KPI calculations ---

  const todaysBookings = useMemo(
    () => bookings.filter((b) => isToday(parseISO(b.date)) && b.status !== 'cancelled'),
    [bookings],
  );

  const revenueToday = useMemo(
    () =>
      todaysBookings
        .filter((b) => b.status === 'completed' || b.status === 'confirmed')
        .reduce((sum, b) => sum + (serviceMap[b.serviceId]?.price ?? 0), 0),
    [todaysBookings, serviceMap],
  );

  const last30DaysBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const d = parseISO(b.date);
        return isWithinInterval(d, { start: thirtyDaysAgo, end: today });
      }),
    [bookings, thirtyDaysAgo, today],
  );

  const activeClients = useMemo(() => {
    const ids = new Set(
      last30DaysBookings.filter((b) => b.status !== 'cancelled').map((b) => b.clientId),
    );
    return ids.size;
  }, [last30DaysBookings]);

  const noShowRate = useMemo(() => {
    if (last30DaysBookings.length === 0) return 0;
    const cancelled = last30DaysBookings.filter((b) => b.status === 'cancelled').length;
    return Math.round((cancelled / last30DaysBookings.length) * 100);
  }, [last30DaysBookings]);

  // --- Revenue trend (last 30 days) ---

  const revenueTrendData = useMemo(() => {
    const data: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRevenue = bookings
        .filter((b) => b.date === dayStr && b.status === 'completed')
        .reduce((sum, b) => sum + (serviceMap[b.serviceId]?.price ?? 0), 0);
      data.push({ date: format(day, 'MMM dd'), revenue: dayRevenue });
    }
    return data;
  }, [bookings, serviceMap, today]);

  // --- Top services by bookings ---

  const topServicesData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings
      .filter((b) => b.status !== 'cancelled')
      .forEach((b) => {
        counts[b.serviceId] = (counts[b.serviceId] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([serviceId, count]) => ({
        name: serviceMap[serviceId]?.name ?? 'Unknown',
        bookings: count,
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  }, [bookings, serviceMap]);

  // --- Upcoming appointments ---

  const upcomingBookings = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return bookings
      .filter(
        (b) =>
          (b.status === 'confirmed' || b.status === 'pending') &&
          (b.date > todayStr || (b.date === todayStr && b.time >= format(new Date(), 'HH:mm'))),
      )
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      })
      .slice(0, 10);
  }, [bookings, today]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your salon's performance"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Bookings"
          value={todaysBookings.length}
          icon={Calendar}
          description="Appointments scheduled today"
        />
        <KPICard
          title="Revenue Today"
          value={`$${revenueToday.toFixed(2)}`}
          icon={DollarSign}
          description="From confirmed & completed"
        />
        <KPICard
          title="Active Clients"
          value={activeClients}
          icon={Users}
          description="Unique clients in last 30 days"
        />
        <KPICard
          title="No-show Rate"
          value={`${noShowRate}%`}
          icon={AlertTriangle}
          description="Cancellations in last 30 days"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d6336c" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#d6336c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                <XAxis dataKey="date" fontSize={11} tickMargin={8} stroke="var(--muted-foreground)" />
                <YAxis fontSize={11} tickFormatter={(v) => `$${v}`} stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '13px' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d6336c"
                  strokeWidth={2.5}
                  dot={false}
                  fill="url(#revGrad)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle>Top Services by Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topServicesData} layout="vertical" margin={{ left: 80 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d6336c" />
                    <stop offset="100%" stopColor="#f48fb1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis dataKey="name" type="category" fontSize={12} width={80} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '13px' }} />
                <Bar dataKey="bookings" fill="url(#barGrad)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            {upcomingBookings.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No upcoming appointments
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((booking) => {
                  const client = clientMap[booking.clientId];
                  const service = serviceMap[booking.serviceId];
                  const staffMember = staffMap[booking.staffId];
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary uppercase leading-none">{format(parseISO(booking.date), 'MMM')}</span>
                          <span className="text-sm font-bold text-primary leading-none">{format(parseISO(booking.date), 'dd')}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {client?.name ?? 'Unknown Client'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {service?.name ?? 'Unknown Service'} &middot; {booking.time} &middot; {staffMember?.name ?? 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
