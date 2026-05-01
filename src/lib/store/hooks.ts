import { useStore } from './index';
import { Booking, Staff, Service, Product, Client, Campaign, Coupon, Earning, PointsHistory, Location, Reward, Organization } from '@/types';

// ── Tenant-scoped selector hooks ────────────────────────────────────────────
// All hooks filter by the current org. Bookings/products/earnings further
// scope to current location when scope === 'location' (default).
//
// Usage:
//   const bookings = useTenantBookings();              // current location only
//   const allOrgBookings = useTenantBookings('org');   // all locations in org

type Scope = 'org' | 'location';

export function useCurrentOrg(): { org: Organization | undefined; locations: Location[] } {
  return useStore(s => ({
    org: s.organizations.find(o => o.id === s.currentOrgId),
    locations: s.locations.filter(l => l.orgId === s.currentOrgId),
  }));
}

export function useTenantBookings(scope: Scope = 'location'): Booking[] {
  return useStore(s => s.bookings.filter(b =>
    b.orgId === s.currentOrgId && (scope === 'org' || b.locationId === s.currentLocationId),
  ));
}

export function useTenantStaff(scope: Scope = 'location'): Staff[] {
  return useStore(s => s.staff.filter(st =>
    st.orgId === s.currentOrgId && (scope === 'org' || st.locationIds.includes(s.currentLocationId)),
  ));
}

export function useTenantServices(scope: Scope = 'location'): Service[] {
  return useStore(s => s.services.filter(sv =>
    sv.orgId === s.currentOrgId && (scope === 'org' || sv.locationIds.includes(s.currentLocationId)),
  ));
}

export function useTenantProducts(scope: Scope = 'location'): Product[] {
  return useStore(s => s.products.filter(p =>
    p.orgId === s.currentOrgId && (scope === 'org' || p.locationId === s.currentLocationId),
  ));
}

export function useTenantClients(): Client[] {
  return useStore(s => s.clients.filter(c => c.orgId === s.currentOrgId));
}

export function useTenantCampaigns(): Campaign[] {
  return useStore(s => s.campaigns.filter(c => c.orgId === s.currentOrgId));
}

export function useTenantCoupons(): Coupon[] {
  return useStore(s => s.coupons.filter(c => c.orgId === s.currentOrgId));
}

export function useTenantEarnings(scope: Scope = 'location'): Earning[] {
  return useStore(s => s.earnings.filter(e =>
    e.orgId === s.currentOrgId && (scope === 'org' || e.locationId === s.currentLocationId),
  ));
}

export function useTenantPointsHistory(): PointsHistory[] {
  return useStore(s => s.pointsHistory.filter(p => p.orgId === s.currentOrgId));
}

export function useTenantRewards(): Reward[] {
  return useStore(s => s.rewards.filter(r => r.orgId === s.currentOrgId));
}
