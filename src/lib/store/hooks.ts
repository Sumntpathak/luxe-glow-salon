import { useMemo } from 'react';
import { useStore } from './index';
import { Booking, Staff, Service, Product, Client, Campaign, Coupon, Earning, PointsHistory, Location, Reward, Organization } from '@/types';

// ── Tenant-scoped selector hooks ────────────────────────────────────────────
// IMPORTANT: each selector is split into stable primitive/array reads from the
// zustand store, then `useMemo` derives the filtered result. Returning
// `s.X.filter(...)` *directly* from useStore creates a fresh array reference
// every render → "getSnapshot should be cached" → infinite update loop.
// See: https://github.com/pmndrs/zustand/discussions/1937

type Scope = 'org' | 'location';

export function useCurrentOrg(): { org: Organization | undefined; locations: Location[] } {
  const organizations = useStore(s => s.organizations);
  const locations = useStore(s => s.locations);
  const currentOrgId = useStore(s => s.currentOrgId);
  return useMemo(() => ({
    org: organizations.find(o => o.id === currentOrgId),
    locations: locations.filter(l => l.orgId === currentOrgId),
  }), [organizations, locations, currentOrgId]);
}

export function useTenantBookings(scope: Scope = 'location'): Booking[] {
  const bookings = useStore(s => s.bookings);
  const currentOrgId = useStore(s => s.currentOrgId);
  const currentLocationId = useStore(s => s.currentLocationId);
  return useMemo(
    () => bookings.filter(b =>
      b.orgId === currentOrgId && (scope === 'org' || b.locationId === currentLocationId),
    ),
    [bookings, currentOrgId, currentLocationId, scope],
  );
}

export function useTenantStaff(scope: Scope = 'location'): Staff[] {
  const staff = useStore(s => s.staff);
  const currentOrgId = useStore(s => s.currentOrgId);
  const currentLocationId = useStore(s => s.currentLocationId);
  return useMemo(
    () => staff.filter(st =>
      st.orgId === currentOrgId && (scope === 'org' || st.locationIds.includes(currentLocationId)),
    ),
    [staff, currentOrgId, currentLocationId, scope],
  );
}

export function useTenantServices(scope: Scope = 'location'): Service[] {
  const services = useStore(s => s.services);
  const currentOrgId = useStore(s => s.currentOrgId);
  const currentLocationId = useStore(s => s.currentLocationId);
  return useMemo(
    () => services.filter(sv =>
      sv.orgId === currentOrgId && (scope === 'org' || sv.locationIds.includes(currentLocationId)),
    ),
    [services, currentOrgId, currentLocationId, scope],
  );
}

export function useTenantProducts(scope: Scope = 'location'): Product[] {
  const products = useStore(s => s.products);
  const currentOrgId = useStore(s => s.currentOrgId);
  const currentLocationId = useStore(s => s.currentLocationId);
  return useMemo(
    () => products.filter(p =>
      p.orgId === currentOrgId && (scope === 'org' || p.locationId === currentLocationId),
    ),
    [products, currentOrgId, currentLocationId, scope],
  );
}

export function useTenantClients(): Client[] {
  const clients = useStore(s => s.clients);
  const currentOrgId = useStore(s => s.currentOrgId);
  return useMemo(() => clients.filter(c => c.orgId === currentOrgId), [clients, currentOrgId]);
}

export function useTenantCampaigns(): Campaign[] {
  const campaigns = useStore(s => s.campaigns);
  const currentOrgId = useStore(s => s.currentOrgId);
  return useMemo(() => campaigns.filter(c => c.orgId === currentOrgId), [campaigns, currentOrgId]);
}

export function useTenantCoupons(): Coupon[] {
  const coupons = useStore(s => s.coupons);
  const currentOrgId = useStore(s => s.currentOrgId);
  return useMemo(() => coupons.filter(c => c.orgId === currentOrgId), [coupons, currentOrgId]);
}

export function useTenantEarnings(scope: Scope = 'location'): Earning[] {
  const earnings = useStore(s => s.earnings);
  const currentOrgId = useStore(s => s.currentOrgId);
  const currentLocationId = useStore(s => s.currentLocationId);
  return useMemo(
    () => earnings.filter(e =>
      e.orgId === currentOrgId && (scope === 'org' || e.locationId === currentLocationId),
    ),
    [earnings, currentOrgId, currentLocationId, scope],
  );
}

export function useTenantPointsHistory(): PointsHistory[] {
  const pointsHistory = useStore(s => s.pointsHistory);
  const currentOrgId = useStore(s => s.currentOrgId);
  return useMemo(() => pointsHistory.filter(p => p.orgId === currentOrgId), [pointsHistory, currentOrgId]);
}

export function useTenantRewards(): Reward[] {
  const rewards = useStore(s => s.rewards);
  const currentOrgId = useStore(s => s.currentOrgId);
  return useMemo(() => rewards.filter(r => r.orgId === currentOrgId), [rewards, currentOrgId]);
}
