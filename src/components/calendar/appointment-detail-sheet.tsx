import { format, parseISO } from 'date-fns';
import { Ban, CheckCircle2, Mail, Phone, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Booking } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStore } from '@/lib/store';
import { useTenantClients, useTenantServices, useTenantStaff } from '@/lib/store/hooks';
import { STATUS_STYLES } from '@/lib/calendar/utils';
import { cn } from '@/lib/utils';

interface AppointmentDetailSheetProps {
  booking: Booking | null;
  onClose: () => void;
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function formatCurrency(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

export default function AppointmentDetailSheet({ booking, onClose }: AppointmentDetailSheetProps) {
  const clients = useTenantClients();
  const staff = useTenantStaff();
  const services = useTenantServices();
  const updateBooking = useStore((s) => s.updateBooking);
  const cancelBooking = useStore((s) => s.cancelBooking);

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  if (!booking) return <Sheet open={false} onOpenChange={handleOpenChange} />;

  const client = clients.find((c) => c.id === booking.clientId);
  const sf = staff.find((s) => s.id === booking.staffId);
  const svc = services.find((s) => s.id === booking.serviceId);
  const clientName = client?.name ?? 'Unknown client';
  const styles = STATUS_STYLES[booking.status];
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

  let dateLabel = booking.date;
  try { dateLabel = format(parseISO(booking.date), 'EEE, MMM d'); } catch { /* keep raw */ }

  // Note: BookingStatus has no `in_service` today — Mark In-Progress maps to
  // `confirmed` per STATUS_STYLES forward-compat aliasing in calendar utils.
  const act = (fn: () => void, msg: string) => () => { fn(); toast.success(msg); onClose(); };
  const onMarkComplete = act(() => updateBooking(booking.id, { status: 'completed' }), 'Appointment marked complete');
  const onMarkInProgress = act(() => updateBooking(booking.id, { status: 'confirmed' }), 'Appointment marked in-progress');
  const onCancel = act(() => cancelBooking(booking.id), 'Appointment cancelled');

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="p-5 pb-4">
          <div className="flex items-start gap-3">
            <Avatar className="size-12">
              {client?.avatar ? <AvatarImage src={client.avatar} alt={clientName} /> : null}
              <AvatarFallback>{initials(clientName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-lg">{clientName}</SheetTitle>
              <SheetDescription className="sr-only">Appointment detail for {clientName}</SheetDescription>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {client?.email ? (
                  <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted">
                    <Mail className="size-3" />
                    <span className="max-w-[160px] truncate">{client.email}</span>
                  </a>
                ) : null}
                {client?.phone ? (
                  <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted">
                    <Phone className="size-3" />
                    <span>{client.phone}</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <span className={cn('mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide', styles.badge)}>
            {styles.label}
          </span>
        </SheetHeader>
        <Separator />
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{svc?.name ?? 'Service'}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {svc ? `${svc.duration} min · ${formatCurrency(svc.price)}` : '—'}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{dateLabel}</div>
                <div className="font-mono">{booking.time} – {booking.endTime}</div>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                {sf?.avatar ? <AvatarImage src={sf.avatar} alt={sf.name} /> : null}
                <AvatarFallback>{initials(sf?.name ?? '?')}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <span className="text-muted-foreground">with </span>
                <span className="font-medium">{sf?.name ?? 'Unassigned'}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Notes</div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-foreground/90">
              {booking.notes && booking.notes.trim().length > 0 ? (
                <p className="whitespace-pre-wrap">{booking.notes}</p>
              ) : (
                <p className="text-muted-foreground italic">No notes</p>
              )}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 mt-auto border-t bg-background p-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onMarkComplete} className="flex-1 min-w-[140px]">
              <CheckCircle2 className="mr-1.5 size-4" />Mark Complete
            </Button>
            <Button variant="outline" onClick={onMarkInProgress} className="flex-1 min-w-[140px]">
              <PlayCircle className="mr-1.5 size-4" />Mark In-Progress
            </Button>
            {canCancel ? (
              <Button variant="destructive" onClick={onCancel} className="flex-1 min-w-[120px]">
                <Ban className="mr-1.5 size-4" />Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
