import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Role, User, Staff, Client, Service, Booking, Product,
  Campaign, Coupon, SalonSettings, PointsHistory, Reward, Earning, BookingStatus,
  Organization, Location, Plan, Admin, WorkingHours, BookingRules,
} from '@/types';
import {
  adminUser, staffMembers, clients, services, bookings,
  products, campaigns, coupons, salonSettings, pointsHistory, rewards, earnings,
  organizations, locations, DEFAULT_ORG_ID, DEFAULT_LOCATION_ID,
} from '@/lib/mock-data';

export interface SignupInput {
  orgName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
}

const defaultSignupHours: WorkingHours = {
  monday: { isOpen: true, open: '09:00', close: '18:00' },
  tuesday: { isOpen: true, open: '09:00', close: '18:00' },
  wednesday: { isOpen: true, open: '09:00', close: '18:00' },
  thursday: { isOpen: true, open: '09:00', close: '18:00' },
  friday: { isOpen: true, open: '09:00', close: '18:00' },
  saturday: { isOpen: true, open: '10:00', close: '17:00' },
  sunday: { isOpen: false, open: '10:00', close: '15:00' },
};

const defaultBookingRules: BookingRules = {
  minAdvanceHours: 2,
  maxFutureDays: 30,
  cancellationWindowHours: 24,
};

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

interface AppState {
  // Auth
  currentUser: (User & { role: Role }) | null;
  login: (role: Role, email?: string) => void;
  logout: () => void;

  // Tenancy
  organizations: Organization[];
  locations: Location[];
  currentOrgId: string;
  currentLocationId: string;
  setCurrentLocation: (locationId: string) => void;
  addLocation: (l: Location) => void;
  updateOrganization: (id: string, data: Partial<Organization>) => void;
  signupOrganization: (input: SignupInput) => { org: Organization; location: Location; admin: Admin };
  subscribe: (plan: Plan) => void;

  // Staff
  staff: Staff[];
  addStaff: (s: Omit<Staff, 'orgId' | 'locationIds'>) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;

  // Clients
  clients: Client[];
  updateClient: (id: string, data: Partial<Client>) => void;

  // Services
  services: Service[];
  addService: (s: Omit<Service, 'orgId' | 'locationIds'>) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Bookings
  bookings: Booking[];
  addBooking: (b: Omit<Booking, 'orgId' | 'locationId'>) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (p: Omit<Product, 'orgId' | 'locationId'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  adjustStock: (id: string, delta: number) => void;

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (c: Omit<Campaign, 'orgId'>) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;

  // Coupons
  coupons: Coupon[];
  addCoupon: (c: Omit<Coupon, 'orgId'>) => void;

  // Settings
  salonSettings: SalonSettings;
  updateSalonSettings: (data: Partial<SalonSettings>) => void;

  // Points
  pointsHistory: PointsHistory[];
  addPoints: (entry: Omit<PointsHistory, 'orgId'>) => void;

  // Rewards
  rewards: Reward[];

  // Earnings
  earnings: Earning[];
  addEarning: (e: Omit<Earning, 'orgId' | 'locationId'>) => void;

  // Dark mode
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Tenancy
      organizations,
      locations,
      currentOrgId: DEFAULT_ORG_ID,
      currentLocationId: DEFAULT_LOCATION_ID,
      setCurrentLocation: (locationId) => set({ currentLocationId: locationId }),
      addLocation: (l) => set((state) => ({ locations: [...state.locations, l] })),
      updateOrganization: (id, data) => set((state) => ({
        organizations: state.organizations.map(o => o.id === id ? { ...o, ...data } : o),
      })),

      signupOrganization: (input) => {
        const now = new Date();
        const trialEnds = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
        const orgId = `org-${Date.now()}`;
        const adminId = `admin-${Date.now()}`;
        const locationId = `loc-${Date.now()}`;

        const org: Organization = {
          id: orgId,
          name: input.orgName,
          slug: slugify(input.orgName),
          ownerId: adminId,
          plan: 'trial',
          trialEndsAt: trialEnds,
          subscriptionStatus: 'trialing',
          createdAt: now.toISOString(),
        };

        const location: Location = {
          id: locationId,
          orgId,
          name: input.locationName,
          slug: slugify(input.locationName),
          address: input.locationAddress,
          phone: input.locationPhone,
          logoUrl: '',
          workingHours: defaultSignupHours,
          bookingRules: defaultBookingRules,
          isActive: true,
          createdAt: now.toISOString(),
        };

        const admin: Admin = {
          id: adminId,
          orgId,
          name: input.ownerName,
          email: input.ownerEmail,
          phone: input.ownerPhone,
          role: 'admin',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(input.ownerName)}`,
          createdAt: now.toISOString(),
        };

        set((state) => ({
          organizations: [...state.organizations, org],
          locations: [...state.locations, location],
          currentOrgId: orgId,
          currentLocationId: locationId,
          currentUser: admin,
        }));

        return { org, location, admin };
      },

      subscribe: (plan) => set((state) => ({
        organizations: state.organizations.map(o =>
          o.id === state.currentOrgId
            ? { ...o, plan, subscriptionStatus: plan === 'trial' ? 'trialing' : 'active' }
            : o,
        ),
      })),

      // Auth
      currentUser: null,
      login: (role: Role, email?: string) => {
        if (role === 'admin') {
          set({ currentUser: adminUser });
        } else if (role === 'staff') {
          const s = email ? staffMembers.find(x => x.email === email) : staffMembers[0];
          set({ currentUser: s || staffMembers[0] });
        } else {
          const c = email ? clients.find(x => x.email === email) : clients[9]; // client-10 is default demo
          set({ currentUser: c || clients[9] });
        }
      },
      logout: () => set({ currentUser: null }),

      // Staff
      staff: staffMembers,
      addStaff: (s) => set((state) => ({
        staff: [...state.staff, { ...s, orgId: state.currentOrgId, locationIds: [state.currentLocationId] }],
      })),
      updateStaff: (id, data) => set((state) => ({
        staff: state.staff.map(s => s.id === id ? { ...s, ...data } : s),
      })),

      // Clients
      clients: clients,
      updateClient: (id, data) => set((state) => ({
        clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c),
      })),

      // Services
      services: services,
      addService: (s) => set((state) => ({
        services: [...state.services, { ...s, orgId: state.currentOrgId, locationIds: [state.currentLocationId] }],
      })),
      updateService: (id, data) => set((state) => ({
        services: state.services.map(s => s.id === id ? { ...s, ...data } : s),
      })),
      deleteService: (id) => set((state) => ({
        services: state.services.filter(s => s.id !== id),
      })),

      // Bookings
      bookings: bookings,
      addBooking: (b) => set((state) => ({
        bookings: [...state.bookings, { ...b, orgId: state.currentOrgId, locationId: state.currentLocationId }],
      })),
      updateBooking: (id, data) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, ...data } : b),
      })),
      cancelBooking: (id) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b),
      })),

      // Products
      products: products,
      addProduct: (p) => set((state) => ({
        products: [...state.products, { ...p, orgId: state.currentOrgId, locationId: state.currentLocationId }],
      })),
      updateProduct: (id, data) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...data } : p),
      })),
      adjustStock: (id, delta) => set((state) => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, stockLevel: Math.max(0, p.stockLevel + delta) } : p
        ),
      })),

      // Campaigns
      campaigns: campaigns,
      addCampaign: (c) => set((state) => ({
        campaigns: [...state.campaigns, { ...c, orgId: state.currentOrgId }],
      })),
      updateCampaign: (id, data) => set((state) => ({
        campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...data } : c),
      })),

      // Coupons
      coupons: coupons,
      addCoupon: (c) => set((state) => ({
        coupons: [...state.coupons, { ...c, orgId: state.currentOrgId }],
      })),

      // Settings
      salonSettings: salonSettings,
      updateSalonSettings: (data) => set((state) => ({
        salonSettings: { ...state.salonSettings, ...data },
      })),

      // Points
      pointsHistory: pointsHistory,
      addPoints: (entry) => set((state) => ({
        pointsHistory: [...state.pointsHistory, { ...entry, orgId: state.currentOrgId }],
      })),

      // Rewards
      rewards: rewards,

      // Earnings
      earnings: earnings,
      addEarning: (e) => set((state) => ({
        earnings: [...state.earnings, { ...e, orgId: state.currentOrgId, locationId: state.currentLocationId }],
      })),

      // Dark mode
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'salon-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        organizations: state.organizations,
        locations: state.locations,
        currentOrgId: state.currentOrgId,
        currentLocationId: state.currentLocationId,
        bookings: state.bookings,
        clients: state.clients,
        staff: state.staff,
        services: state.services,
        products: state.products,
        campaigns: state.campaigns,
        coupons: state.coupons,
        salonSettings: state.salonSettings,
        pointsHistory: state.pointsHistory,
        earnings: state.earnings,
        darkMode: state.darkMode,
      }),
    }
  )
);
