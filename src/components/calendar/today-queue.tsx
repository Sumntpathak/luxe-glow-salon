import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTenantBookings, useTenantClients, useTenantServices, useTenantStaff } from '@/lib/store/hooks';
import { STATUS_STYLES, groupTodayBookings, type TodayQueueGroups } from '@/lib/calendar/utils';
import { cn } from '@/lib/utils';

interface TodayQueueProps {
  onSelectAppointment: (b: Booking) => void;
  collapsedDefault?: boolean;
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function TodayQueue({ onSelectAppointment, collapsedDefault = false }: TodayQueueProps) {
  const bookings = useTenantBookings();
  const clients = useTenantClients();
  const staff = useTenantStaff();
  const services = useTenantServices();

  const [collapsed, setCollapsed] = useState<boolean>(collapsedDefault);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const groups: TodayQueueGroups = useMemo(() => groupTodayBookings(bookings, now), [bookings, now]);

  const sections: { key: keyof TodayQueueGroups; label: string; rows: Booking[] }[] = [
    { key: 'inProgress', label: 'In Progress', rows: groups.inProgress },
    { key: 'upNext', label: 'Up Next', rows: groups.upNext },
    { key: 'waiting', label: 'Waiting', rows: groups.waiting },
  ];

  const isEmpty = sections.every((s) => s.rows.length === 0);

  if (collapsed) {
    return (
      <aside className="hidden md:flex w-10 shrink-0 border-l flex-col items-center pt-3 bg-background">
        <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(false)} aria-label="Expand today queue">
          <ChevronLeft className="size-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-80 shrink-0 border-l flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">Today</span>
          <span className="text-xs text-muted-foreground">{format(now, 'EEE, MMM d')}</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed(true)} aria-label="Collapse today queue">
          <ChevronRight className="size-4" />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 px-6 py-10 text-center text-muted-foreground">
            <CalendarIcon className="size-8 opacity-40" />
            <p className="text-sm">All clear today</p>
          </div>
        ) : (
          sections.map((section) =>
            section.rows.length === 0 ? null : (
              <section key={section.key} className="border-b last:border-b-0">
                <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{section.label}</span>
                  <span className="text-xs text-muted-foreground">{section.rows.length}</span>
                </div>
                <ul>
                  {section.rows.map((b) => {
                    const client = clients.find((c) => c.id === b.clientId);
                    const sf = staff.find((s) => s.id === b.staffId);
                    const svc = services.find((s) => s.id === b.serviceId);
                    const clientName = client?.name ?? 'Unknown client';
                    const styles = STATUS_STYLES[b.status];
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => onSelectAppointment(b)}
                          className={cn(
                            'group flex w-full items-center gap-3 px-4 py-3 text-left',
                            'hover:bg-muted/50 cursor-pointer transition-colors',
                            'focus-visible:outline-none focus-visible:bg-muted/60',
                          )}
                        >
                          <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">{b.time}</span>
                          <Avatar className="size-8">
                            {client?.avatar ? <AvatarImage src={client.avatar} alt={clientName} /> : null}
                            <AvatarFallback>{initials(clientName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{clientName}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {svc?.name ?? 'Service'} · {sf?.name ?? '—'}
                            </div>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                              styles.badge,
                            )}
                          >
                            {styles.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ),
          )
        )}
      </div>
    </aside>
  );
}
