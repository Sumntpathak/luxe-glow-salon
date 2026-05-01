import { useMemo, useState } from 'react';
import { X, Sparkles, GripVertical, Clock } from 'lucide-react';
import { Service, Staff } from '@/types';
import { CartItem, cartDuration, cartPrice } from '@/lib/booking/availability';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface BookingCartProps {
  items: CartItem[];
  services: Service[];
  staff: Staff[];
  onChangeStaff: (cartItemId: string, staffPref: string | 'any') => void;
  onRemove: (cartItemId: string) => void;
  onReorder?: (newOrder: string[]) => void;
}

function formatDuration(min: number): string {
  if (min <= 0) return '0 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export default function BookingCart({
  items,
  services,
  staff,
  onChangeStaff,
  onRemove,
  onReorder,
}: BookingCartProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const totalDur = useMemo(() => cartDuration(items, services), [items, services]);
  const totalPrice = useMemo(() => cartPrice(items, services), [items, services]);

  const handleDragStart = (id: string) => () => setDragId(id);
  const handleDragOver = (id: string) => (e: React.DragEvent) => {
    if (!dragId) return;
    e.preventDefault();
    if (overId !== id) setOverId(id);
  };
  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!onReorder || !dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const order = items.map((i) => i.id);
    const from = order.indexOf(dragId);
    const to = order.indexOf(targetId);
    if (from === -1 || to === -1) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    onReorder(next);
    setDragId(null);
    setOverId(null);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <section className="flex flex-col rounded-2xl border border-border/60 bg-card/70 shadow-sm">
      <header className="flex items-center justify-between gap-2 px-4 sm:px-5 py-4 border-b border-border/40">
        <h2 className="font-semibold text-sm tracking-tight">Your selections</h2>
        {items.length > 0 && (
          <Badge variant="secondary" className="text-[11px]">
            {items.length} {items.length === 1 ? 'service' : 'services'}
          </Badge>
        )}
      </header>

      <div className="flex-1 px-3 sm:px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 py-12 px-4 text-center">
            <Sparkles className="size-6 text-primary/70" />
            <p className="text-sm font-medium">Pick your services to get started</p>
            <p className="text-xs text-muted-foreground">
              Add services from the catalog to build your appointment
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => {
              const svc = services.find((s) => s.id === item.serviceId);
              if (!svc) return null;
              const eligible = staff.filter(
                (s) => s.isActive && svc.assignableStaff.includes(s.id),
              );
              const onlyOne = eligible.length === 1;
              const draggable = Boolean(onReorder);
              return (
                <li
                  key={item.id}
                  draggable={draggable}
                  onDragStart={draggable ? handleDragStart(item.id) : undefined}
                  onDragOver={draggable ? handleDragOver(item.id) : undefined}
                  onDrop={draggable ? handleDrop(item.id) : undefined}
                  onDragEnd={draggable ? handleDragEnd : undefined}
                  className={cn(
                    'group flex items-start gap-2 rounded-xl border border-border/40 bg-background/60 p-3 transition-all',
                    overId === item.id && 'border-primary/50 bg-primary/5',
                    dragId === item.id && 'opacity-50',
                  )}
                >
                  {draggable && (
                    <button
                      type="button"
                      aria-label="Reorder service"
                      className="mt-1 cursor-grab text-muted-foreground/60 hover:text-muted-foreground"
                    >
                      <GripVertical className="size-4" />
                    </button>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">{svc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {svc.duration} min
                          </span>
                          <span className="text-muted-foreground/40">·</span>
                          <span>${svc.price}</span>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Remove ${svc.name}`}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>

                    {onlyOne ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-primary/60" />
                        <span className="text-foreground/80">{eligible[0].name}</span>
                      </div>
                    ) : (
                      <Select
                        value={item.staffPreference}
                        onValueChange={(v) => onChangeStaff(item.id, v ?? 'any')}
                      >
                        <SelectTrigger className="h-8 w-full text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">
                            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                            Any available
                          </SelectItem>
                          {eligible.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <span className="size-1.5 rounded-full bg-primary/60" />
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <footer className="sticky bottom-0 flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-t border-border/40 bg-card/90 rounded-b-2xl backdrop-blur">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatDuration(totalDur)}
            </span>
          </div>
          <div className="text-xl font-bold tracking-tight">${totalPrice}</div>
        </footer>
      )}
    </section>
  );
}
