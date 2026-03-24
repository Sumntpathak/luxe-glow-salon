

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Clock,
} from 'lucide-react';
import {
  format,
  parseISO,
  isWithinInterval,
  eachDayOfInterval,
  subDays,
  getDay,
  startOfDay,
  endOfDay,
} from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

const COLORS = ['#d6336c', '#f48fb1', '#26a69a'];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9am to 6pm

export default function AdminAnalyticsPage() {
  const { bookings, services, staff } = useStore();

  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const dateInterval = useMemo(
    () => ({
      start: startOfDay(parseISO(startDate)),
      end: endOfDay(parseISO(endDate)),
    }),
    [startDate, endDate]
  );

  const filteredBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const d = parseISO(b.date);
        return isWithinInterval(d, dateInterval);
      }),
    [bookings, dateInterval]
  );

  // ── Revenue by Service Category (Pie) ──
  const revenueByCategoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredBookings
      .filter((b) => b.status === 'completed')
      .forEach((b) => {
        const svc = services.find((s) => s.id === b.serviceId);
        if (svc) {
          categoryTotals[svc.category] =
            (categoryTotals[svc.category] || 0) + svc.price;
        }
      });
    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredBookings, services]);

  // ── Bookings Heatmap Data ──
  const heatmapData = useMemo(() => {
    const grid: number[][] = Array.from({ length: HOURS.length }, () =>
      Array(7).fill(0)
    );
    filteredBookings
      .filter((b) => b.status !== 'cancelled')
      .forEach((b) => {
        const d = parseISO(b.date);
        // getDay returns 0=Sun, convert to 0=Mon
        const dayOfWeek = (getDay(d) + 6) % 7;
        const hour = parseInt(b.time.split(':')[0], 10);
        const hourIdx = hour - 9;
        if (hourIdx >= 0 && hourIdx < HOURS.length && dayOfWeek < 7) {
          grid[hourIdx][dayOfWeek]++;
        }
      });
    return grid;
  }, [filteredBookings]);

  const heatmapMax = useMemo(
    () => Math.max(1, ...heatmapData.flat()),
    [heatmapData]
  );

  // ── Client Retention: New vs Returning ──
  const retentionData = useMemo(() => {
    const weeks: Record<string, { newClients: number; returning: number }> = {};

    // Determine each client's first booking date (across all bookings, not just filtered)
    const clientFirstBooking: Record<string, string> = {};
    bookings
      .filter((b) => b.status !== 'cancelled')
      .forEach((b) => {
        if (
          !clientFirstBooking[b.clientId] ||
          b.date < clientFirstBooking[b.clientId]
        ) {
          clientFirstBooking[b.clientId] = b.date;
        }
      });

    // Group filtered non-cancelled bookings by week
    filteredBookings
      .filter((b) => b.status !== 'cancelled')
      .forEach((b) => {
        const d = parseISO(b.date);
        const weekStart = format(
          subDays(d, (getDay(d) + 6) % 7),
          'yyyy-MM-dd'
        );
        if (!weeks[weekStart]) {
          weeks[weekStart] = { newClients: 0, returning: 0 };
        }
        const firstDate = clientFirstBooking[b.clientId];
        if (firstDate && firstDate === b.date) {
          weeks[weekStart].newClients++;
        } else {
          weeks[weekStart].returning++;
        }
      });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week: format(parseISO(week), 'MMM dd'),
        New: data.newClients,
        Returning: data.returning,
      }));
  }, [filteredBookings, bookings]);

  // ── Staff Utilization ──
  const staffUtilizationData = useMemo(() => {
    const activeStaff = staff.filter((s) => s.isActive);
    const daysInRange = eachDayOfInterval(dateInterval);

    return activeStaff.map((s) => {
      // Calculate available hours
      let availableMinutes = 0;
      const dayKeys: (keyof typeof s.workingHours)[] = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      daysInRange.forEach((d) => {
        const dayKey = dayKeys[getDay(d)];
        const dayHours = s.workingHours[dayKey];
        if (dayHours.isOpen) {
          const openH = parseInt(dayHours.open.split(':')[0], 10);
          const openM = parseInt(dayHours.open.split(':')[1], 10);
          const closeH = parseInt(dayHours.close.split(':')[0], 10);
          const closeM = parseInt(dayHours.close.split(':')[1], 10);
          availableMinutes += (closeH * 60 + closeM) - (openH * 60 + openM);
        }
      });

      // Calculate booked minutes
      let bookedMinutes = 0;
      filteredBookings
        .filter(
          (b) =>
            b.staffId === s.id &&
            b.status !== 'cancelled'
        )
        .forEach((b) => {
          const svc = services.find((sv) => sv.id === b.serviceId);
          if (svc) {
            bookedMinutes += svc.duration;
          }
        });

      const utilization =
        availableMinutes > 0
          ? Math.round((bookedMinutes / availableMinutes) * 100)
          : 0;

      return {
        name: s.name,
        utilization: Math.min(utilization, 100),
      };
    });
  }, [staff, filteredBookings, services, dateInterval]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Charts and insights for your salon"
      />

      {/* Date Range Picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Revenue by Service Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByCategoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={(props: PieLabelRenderProps) =>
                      `${props.name ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {revenueByCategoryData.map((entry, index) => {
                      const colorMap: Record<string, string> = {
                        Hair: '#8b5cf6',
                        Nails: '#ec4899',
                        Skin: '#10b981',
                      };
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colorMap[entry.name] || COLORS[index % COLORS.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No completed bookings in this date range.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bookings Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Bookings Heatmap (Day / Hour)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* Header row */}
              <div className="grid grid-cols-8 gap-1 mb-1">
                <div className="text-xs text-muted-foreground" />
                {DAY_LABELS.map((day) => (
                  <div
                    key={day}
                    className="text-xs text-center font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>
              {/* Data rows */}
              {HOURS.map((hour, hIdx) => (
                <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                  <div className="text-xs text-muted-foreground flex items-center justify-end pr-1">
                    {hour > 12
                      ? `${hour - 12}pm`
                      : hour === 12
                      ? '12pm'
                      : `${hour}am`}
                  </div>
                  {DAY_LABELS.map((_, dIdx) => {
                    const count = heatmapData[hIdx][dIdx];
                    const intensity = count / heatmapMax;
                    return (
                      <div
                        key={dIdx}
                        className="aspect-square rounded-sm flex items-center justify-center text-xs"
                        style={{
                          backgroundColor:
                            count === 0
                              ? 'var(--muted)'
                              : `rgba(214, 51, 108, ${0.15 + intensity * 0.85})`,
                          color: intensity > 0.5 ? 'white' : undefined,
                        }}
                        title={`${DAY_LABELS[dIdx]} ${hour}:00 - ${count} booking(s)`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Retention: New vs Returning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {retentionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="New"
                    stackId="a"
                    fill="#d6336c"
                    name="New"
                  />
                  <Bar
                    dataKey="Returning"
                    stackId="a"
                    fill="#f48fb1"
                    name="Returning"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No bookings in this date range.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Staff Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Staff Utilization %
            </CardTitle>
          </CardHeader>
          <CardContent>
            {staffUtilizationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={staffUtilizationData}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={75}
                  />
                  <Tooltip formatter={(value) => `${Number(value)}%`} />
                  <Bar dataKey="utilization" fill="#d6336c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">
                No active staff members.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
