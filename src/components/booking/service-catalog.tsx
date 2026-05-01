import { useMemo, useState } from 'react';
import { Plus, Check, Clock, Search } from 'lucide-react';
import { Service, ServiceCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ServiceCatalogProps {
  services: Service[];
  selectedServiceIds: string[];
  onAdd: (service: Service) => void;
}

type Category = 'All' | ServiceCategory;
const CATEGORIES: Category[] = ['All', 'Hair', 'Nails', 'Skin'];

function categoryClasses(cat: ServiceCategory): string {
  if (cat === 'Hair') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
  if (cat === 'Nails') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
}

export default function ServiceCatalog({ services, selectedServiceIds, onAdd }: ServiceCatalogProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Category>('All');

  const counts = useMemo(() => {
    const c: Record<Category, number> = { All: services.length, Hair: 0, Nails: 0, Skin: 0 };
    for (const s of services) c[s.category] += 1;
    return c;
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return services.filter((s) => {
      if (active !== 'All' && s.category !== active) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    });
  }, [services, query, active]);

  const selected = useMemo(() => new Set(selectedServiceIds), [selectedServiceIds]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services"
          className="pl-9"
          aria-label="Search services"
        />
      </div>

      <div className="flex items-center gap-1 border-b border-border/40 -mx-1 px-1 overflow-x-auto">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={cn(
                'relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{cat}</span>
              <span className="ml-1.5 text-xs text-muted-foreground/70">· {counts[cat]}</span>
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 py-16 text-center text-sm text-muted-foreground">
          No services match
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((s) => {
            const isAdded = selected.has(s.id);
            return (
              <article
                key={s.id}
                className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                {s.photoUrl && (
                  <img
                    src={s.photoUrl}
                    alt={s.name}
                    className="h-24 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{s.name}</h3>
                    <Badge variant="secondary" className={cn('text-[10px]', categoryClasses(s.category))}>
                      {s.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      {s.duration} min
                    </span>
                    <span className="text-base font-semibold text-foreground">${s.price}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={isAdded ? 'secondary' : 'default'}
                    onClick={() => onAdd(s)}
                    aria-label={isAdded ? `Add another ${s.name}` : `Add ${s.name}`}
                  >
                    {isAdded ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    {isAdded ? 'Added' : 'Add'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
