import { Award, Crown, Filter, Search, Star, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type Tier = 'Gold' | 'Silver' | 'Bronze';
export type LastVisitWindow = 'all' | 'last30' | 'last90' | 'over6mo' | 'never';

export const TIERS: Tier[] = ['Gold', 'Silver', 'Bronze'];

export const tierIcon: Record<Tier, typeof Crown> = {
  Gold: Crown,
  Silver: Award,
  Bronze: Star,
};

interface ClientsFilterSidebarProps {
  search: string;
  onSearchChange: (v: string) => void;
  allTags: string[];
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  selectedTiers: Set<Tier>;
  onToggleTier: (tier: Tier) => void;
  lastVisit: LastVisitWindow;
  onLastVisitChange: (v: LastVisitWindow) => void;
  hasUpcomingOnly: boolean;
  onToggleHasUpcoming: () => void;
  onClear: () => void;
  hasAnyFilter: boolean;
}

const LAST_VISIT_OPTIONS: { value: LastVisitWindow; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'over6mo', label: 'Over 6 months ago' },
  { value: 'never', label: 'Never visited' },
];

export function ClientsFilterSidebar(props: ClientsFilterSidebarProps) {
  const {
    search,
    onSearchChange,
    allTags,
    selectedTags,
    onToggleTag,
    selectedTiers,
    onToggleTier,
    lastVisit,
    onLastVisitChange,
    hasUpcomingOnly,
    onToggleHasUpcoming,
    onClear,
    hasAnyFilter,
  } = props;

  return (
    <aside className="w-full lg:w-60 lg:shrink-0 lg:sticky lg:top-20 lg:self-start space-y-6">
      <Section title="Search">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Name, email, phone…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </Section>

      {allTags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const active = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    active
                      ? 'bg-primary/15 text-primary border-primary/40'
                      : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/70',
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Loyalty tier">
        <div className="space-y-1.5">
          {TIERS.map((tier) => {
            const Icon = tierIcon[tier];
            return (
              <label
                key={tier}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground"
              >
                <input
                  type="checkbox"
                  checked={selectedTiers.has(tier)}
                  onChange={() => onToggleTier(tier)}
                  className="h-4 w-4 rounded border-input"
                />
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{tier}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Last visit">
        <div className="space-y-1.5">
          {LAST_VISIT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground"
            >
              <input
                type="radio"
                name="lastVisit"
                checked={lastVisit === opt.value}
                onChange={() => onLastVisitChange(opt.value)}
                className="h-4 w-4 border-input"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Has upcoming?">
        <button
          type="button"
          onClick={onToggleHasUpcoming}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors',
            hasUpcomingOnly
              ? 'bg-primary/15 text-primary border-primary/40'
              : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/70',
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {hasUpcomingOnly ? 'Showing only with upcoming' : 'Show all'}
        </button>
      </Section>

      {hasAnyFilter && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
