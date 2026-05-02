import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import {
  ClientsFilterSidebar,
  LastVisitWindow,
  Tier,
} from '@/components/clients/clients-filter-sidebar';
import {
  ClientsTable,
  SortKey,
  SortState,
} from '@/components/clients/clients-table';
import { useTenantBookings, useTenantClients, useTenantServices } from '@/lib/store/hooks';
import { openComposer } from '@/components/messages/message-composer';
import {
  ClientMetrics,
  computeAllClientMetrics,
  daysSinceLastVisit,
} from '@/lib/clients/metrics';

const matchesLastVisitWindow = (
  metrics: ClientMetrics,
  window: LastVisitWindow,
): boolean => {
  if (window === 'all') return true;
  const days = daysSinceLastVisit(metrics.lastVisitDate);
  if (window === 'never') return days === null;
  if (days === null) return false;
  if (window === 'last30') return days <= 30;
  if (window === 'last90') return days <= 90;
  if (window === 'over6mo') return days > 180;
  return true;
};

const toggleSetItem = <T,>(set: Set<T>, item: T): Set<T> => {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
};

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const clients = useTenantClients();
  const bookings = useTenantBookings('org');
  const services = useTenantServices('org');

  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedTiers, setSelectedTiers] = useState<Set<Tier>>(new Set());
  const [lastVisit, setLastVisit] = useState<LastVisitWindow>('all');
  const [hasUpcomingOnly, setHasUpcomingOnly] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: 'lastVisitDate', dir: 'desc' });

  const metricsMap = useMemo(
    () => computeAllClientMetrics(clients.map((c) => c.id), bookings, services),
    [clients, bookings, services],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of clients) (c.tags ?? []).forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (q) {
        const hay = `${c.name} ${c.email} ${c.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedTags.size > 0) {
        const tags = c.tags ?? [];
        if (!tags.some((t) => selectedTags.has(t))) return false;
      }
      if (selectedTiers.size > 0 && !selectedTiers.has(c.loyaltyTier)) return false;
      const m = metricsMap.get(c.id);
      if (!m) return false;
      if (!matchesLastVisitWindow(m, lastVisit)) return false;
      if (hasUpcomingOnly && m.upcomingCount <= 0) return false;
      return true;
    });
  }, [clients, search, selectedTags, selectedTiers, lastVisit, hasUpcomingOnly, metricsMap]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sort.dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const ma = metricsMap.get(a.id);
      const mb = metricsMap.get(b.id);
      switch (sort.key) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'visits':
          return ((ma?.visitCount ?? 0) - (mb?.visitCount ?? 0)) * dir;
        case 'lifetimeValue':
          return ((ma?.lifetimeValue ?? 0) - (mb?.lifetimeValue ?? 0)) * dir;
        case 'lastVisitDate': {
          const av = ma?.lastVisitDate ?? '';
          const bv = mb?.lastVisitDate ?? '';
          if (av === bv) return 0;
          if (!av) return 1;
          if (!bv) return -1;
          return av < bv ? -1 * dir : 1 * dir;
        }
      }
    });
    return arr;
  }, [filtered, sort, metricsMap]);

  const activeThisMonth = useMemo(() => {
    let count = 0;
    metricsMap.forEach((m) => {
      const days = daysSinceLastVisit(m.lastVisitDate);
      if (days !== null && days <= 30) count += 1;
    });
    return count;
  }, [metricsMap]);

  const handleSort = (key: SortKey): void => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    );
  };

  const hasAnyFilter =
    search.length > 0 ||
    selectedTags.size > 0 ||
    selectedTiers.size > 0 ||
    lastVisit !== 'all' ||
    hasUpcomingOnly;

  const clearAll = (): void => {
    setSearch('');
    setSelectedTags(new Set());
    setSelectedTiers(new Set());
    setLastVisit('all');
    setHasUpcomingOnly(false);
  };

  const openQuickAdd = (): void => {
    window.dispatchEvent(new CustomEvent('luxe:open-quick-add-client'));
  };

  const goToBook = (e: React.MouseEvent, clientId: string): void => {
    e.stopPropagation();
    navigate(`/book?clientId=${clientId}`);
  };

  const onMessageClick = (e: React.MouseEvent, clientId: string): void => {
    e.stopPropagation();
    openComposer({ clientId });
  };

  const description = `${clients.length} client${clients.length === 1 ? '' : 's'} · ${activeThisMonth} active this month`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={description}
        action={
          <Button onClick={openQuickAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add client
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <ClientsFilterSidebar
          search={search}
          onSearchChange={setSearch}
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={(t) => setSelectedTags((prev) => toggleSetItem(prev, t))}
          selectedTiers={selectedTiers}
          onToggleTier={(t) => setSelectedTiers((prev) => toggleSetItem(prev, t))}
          lastVisit={lastVisit}
          onLastVisitChange={setLastVisit}
          hasUpcomingOnly={hasUpcomingOnly}
          onToggleHasUpcoming={() => setHasUpcomingOnly((v) => !v)}
          onClear={clearAll}
          hasAnyFilter={hasAnyFilter}
        />

        <div className="flex-1 min-w-0">
          {sorted.length === 0 ? (
            <div className="rounded-lg border border-border/60 bg-card">
              <EmptyState
                icon={Users}
                title="No clients match"
                description={
                  hasAnyFilter
                    ? 'Try clearing some filters or adjusting your search.'
                    : 'Add your first client to get started.'
                }
                action={
                  hasAnyFilter ? (
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button size="sm" onClick={openQuickAdd}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add client
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <ClientsTable
              clients={sorted}
              metricsMap={metricsMap}
              sort={sort}
              onSort={handleSort}
              onRowClick={(id) => navigate(`/admin/clients/${id}`)}
              onBookClick={goToBook}
              onMessageClick={onMessageClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
