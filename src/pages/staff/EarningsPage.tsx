

import { useStore } from '@/lib/store';
import { PageHeader } from '@/components/shared/page-header';
import { KPICard } from '@/components/shared/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Wallet, Target } from 'lucide-react';
import {
  format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isWithinInterval, eachDayOfInterval,
} from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MONTHLY_TARGET = 2000;

export default function StaffEarningsPage() {
  const { currentUser, earnings, bookings, services } = useStore();

  if (!currentUser) return null;

  const myEarnings = earnings.filter((e) => e.staffId === currentUser.id);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // This month's earnings
  const monthEarnings = myEarnings.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
  );

  const totalEarnings = monthEarnings.reduce(
    (sum, e) => sum + e.commissionAmount + e.tips,
    0
  );
  const totalCommission = monthEarnings.reduce(
    (sum, e) => sum + e.commissionAmount,
    0
  );
  const totalTips = monthEarnings.reduce((sum, e) => sum + e.tips, 0);
  const targetProgress = Math.min((totalEarnings / MONTHLY_TARGET) * 100, 100);

  // Weekly chart data
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeklyChartData = weekDays.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEarnings = myEarnings.filter((e) => e.date === dayStr);
    const commission = dayEarnings.reduce((s, e) => s + e.commissionAmount, 0);
    const tips = dayEarnings.reduce((s, e) => s + e.tips, 0);
    return {
      day: format(day, 'EEE'),
      commission,
      tips,
    };
  });

  // Resolve service name from earning via booking
  const resolveServiceName = (bookingId: string): string => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return 'Unknown';
    const service = services.find((s) => s.id === booking.serviceId);
    return service?.name ?? 'Unknown';
  };

  // Table data sorted by date descending
  const tableData = [...myEarnings].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Earnings"
        description="Track your commission, tips, and monthly targets"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Earnings"
          value={`$${totalEarnings.toFixed(2)}`}
          icon={DollarSign}
          description="This month"
        />
        <KPICard
          title="Commission"
          value={`$${totalCommission.toFixed(2)}`}
          icon={TrendingUp}
          description="This month"
        />
        <KPICard
          title="Tips"
          value={`$${totalTips.toFixed(2)}`}
          icon={Wallet}
          description="This month"
        />
        <KPICard
          title="Monthly Target"
          value={`${targetProgress.toFixed(0)}%`}
          icon={Target}
          description={`$${totalEarnings.toFixed(2)} of $${MONTHLY_TARGET}`}
        />
      </div>

      {/* Weekly Chart & Target Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Earnings Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                  <XAxis dataKey="day" fontSize={11} stroke="var(--muted-foreground)" />
                  <YAxis fontSize={11} stroke="var(--muted-foreground)" />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', fontSize: '13px' }}
                  />
                  <Bar
                    dataKey="commission"
                    name="Commission"
                    fill="#d6336c"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="tips"
                    name="Tips"
                    fill="#f48fb1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Target Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold">
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                of ${MONTHLY_TARGET.toLocaleString()} target
              </p>
            </div>
            <Progress value={targetProgress} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">
              {targetProgress >= 100
                ? 'Target reached!'
                : `$${(MONTHLY_TARGET - totalEarnings).toFixed(2)} remaining`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Service Amount</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Tips</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No earnings recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      {format(parseISO(earning.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{resolveServiceName(earning.bookingId)}</TableCell>
                    <TableCell className="text-right">
                      ${earning.serviceAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${earning.commissionAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${earning.tips.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
