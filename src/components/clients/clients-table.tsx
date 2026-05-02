import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Calendar, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tierIcon, Tier } from '@/components/clients/clients-filter-sidebar';
import { ClientMetrics } from '@/lib/clients/metrics';
import { Client } from '@/types';
import { cn } from '@/lib/utils';

export type SortKey = 'name' | 'visits' | 'lifetimeValue' | 'lastVisitDate';
export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: SortKey;
  dir: SortDir;
}

import { TIER_BADGE_CLASS } from '@/lib/ui/palettes';
const tierBadgeClass = TIER_BADGE_CLASS;

const formatCurrency = (n: number): string =>
  `$${Math.round(n).toLocaleString('en-US')}`;

const lastVisitLabel = (lastVisitDate: string | null): string => {
  if (!lastVisitDate) return 'Never';
  try {
    return `${formatDistanceToNow(parseISO(lastVisitDate))} ago`;
  } catch {
    return format(parseISO(lastVisitDate), 'MMM d, yyyy');
  }
};

const initials = (name: string): string =>
  name.split(' ').map((p) => p.charAt(0)).filter(Boolean).slice(0, 2).join('').toUpperCase();

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}

function SortHeader({ label, sortKey, sort, onSort }: SortHeaderProps) {
  const active = sort.key === sortKey;
  const Indicator = active && sort.dir === 'asc' ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      <span>{label}</span>
      <Indicator
        className={cn(
          'h-3.5 w-3.5 transition-opacity',
          active ? 'opacity-100 text-foreground' : 'opacity-30 group-hover:opacity-60',
        )}
      />
    </button>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const visible = tags.slice(0, 3);
  const extra = tags.length - visible.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((t) => (
        <Badge key={t} variant="secondary" className="text-[10px] h-5 px-1.5">
          {t}
        </Badge>
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground font-medium">+{extra} more</span>
      )}
    </div>
  );
}

export interface ClientsTableProps {
  clients: Client[];
  metricsMap: Map<string, ClientMetrics>;
  sort: SortState;
  onSort: (key: SortKey) => void;
  onRowClick: (clientId: string) => void;
  onBookClick: (e: React.MouseEvent, clientId: string) => void;
  onMessageClick: (e: React.MouseEvent, clientId: string) => void;
}

export function ClientsTable(props: ClientsTableProps) {
  const { clients, metricsMap, sort, onSort, onRowClick, onBookClick, onMessageClick } = props;
  return (
    <div className="rounded-lg border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader label="Client" sortKey="name" sort={sort} onSort={onSort} />
            </TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>
              <SortHeader label="Visits" sortKey="visits" sort={sort} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Lifetime $" sortKey="lifetimeValue" sort={sort} onSort={onSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Last visit" sortKey="lastVisitDate" sort={sort} onSort={onSort} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((c) => {
            const m = metricsMap.get(c.id);
            const TierIcon = tierIcon[c.loyaltyTier];
            return (
              <TableRow
                key={c.id}
                className="group cursor-pointer"
                onClick={() => onRowClick(c.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {c.avatar && <AvatarImage src={c.avatar} alt={c.name} />}
                      <AvatarFallback>{initials(c.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.phone || '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.email || '—'}</TableCell>
                <TableCell>
                  <TagList tags={c.tags ?? []} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={tierBadgeClass[c.loyaltyTier]}>
                    <TierIcon className="h-3 w-3" />
                    {c.loyaltyTier}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{m?.visitCount ?? 0}</TableCell>
                <TableCell className="tabular-nums font-medium">
                  {formatCurrency(m?.lifetimeValue ?? 0)}
                </TableCell>
                <TableCell className="relative pr-24 text-sm text-muted-foreground">
                  {lastVisitLabel(m?.lastVisitDate ?? null)}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => onBookClick(e, c.id)}
                      aria-label="Book appointment"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => onMessageClick(e, c.id)}
                      aria-label="Send message"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
