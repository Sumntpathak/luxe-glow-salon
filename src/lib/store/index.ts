import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Role, User, Staff, Client, Service, Booking, Product,
  Campaign, Coupon, SalonSettings, PointsHistory, Reward, Earning, BookingStatus,
} from '@/types';
import {
  adminUser, staffMembers, clients, services, bookings,
  products, campaigns, coupons, salonSettings, pointsHistory, rewards, earnings,
} from '@/lib/mock-data';

interface AppState {
  // Auth
  currentUser: (User & { role: Role }) | null;
  login: (role: Role, email?: string) => void;
  logout: () => void;

  // Staff
  staff: Staff[];
  addStaff: (s: Staff) => void;
  updateStaff: (id: string, data: Partial<Staff>) => void;

  // Clients
  clients: Client[];
  updateClient: (id: string, data: Partial<Client>) => void;

  // Services
  services: Service[];
  addService: (s: Service) => void;
  updateService: (id: string, data: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Bookings
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  updateBooking: (id: string, data: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  adjustStock: (id: string, delta: number) => void;

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (c: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;

  // Coupons
  coupons: Coupon[];
  addCoupon: (c: Coupon) => void;

  // Settings
  salonSettings: SalonSettings;
  updateSalonSettings: (data: Partial<SalonSettings>) => void;

  // Points
  pointsHistory: PointsHistory[];
  addPoints: (entry: PointsHistory) => void;

  // Rewards
  rewards: Reward[];

  // Earnings
  earnings: Earning[];
  addEarning: (e: Earning) => void;

  // Dark mode
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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
      addStaff: (s) => set((state) => ({ staff: [...state.staff, s] })),
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
      addService: (s) => set((state) => ({ services: [...state.services, s] })),
      updateService: (id, data) => set((state) => ({
        services: state.services.map(s => s.id === id ? { ...s, ...data } : s),
      })),
      deleteService: (id) => set((state) => ({
        services: state.services.filter(s => s.id !== id),
      })),

      // Bookings
      bookings: bookings,
      addBooking: (b) => set((state) => ({ bookings: [...state.bookings, b] })),
      updateBooking: (id, data) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, ...data } : b),
      })),
      cancelBooking: (id) => set((state) => ({
        bookings: state.bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b),
      })),

      // Products
      products: products,
      addProduct: (p) => set((state) => ({ products: [...state.products, p] })),
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
      addCampaign: (c) => set((state) => ({ campaigns: [...state.campaigns, c] })),
      updateCampaign: (id, data) => set((state) => ({
        campaigns: state.campaigns.map(c => c.id === id ? { ...c, ...data } : c),
      })),

      // Coupons
      coupons: coupons,
      addCoupon: (c) => set((state) => ({ coupons: [...state.coupons, c] })),

      // Settings
      salonSettings: salonSettings,
      updateSalonSettings: (data) => set((state) => ({
        salonSettings: { ...state.salonSettings, ...data },
      })),

      // Points
      pointsHistory: pointsHistory,
      addPoints: (entry) => set((state) => ({
        pointsHistory: [...state.pointsHistory, entry],
      })),

      // Rewards
      rewards: rewards,

      // Earnings
      earnings: earnings,
      addEarning: (e) => set((state) => ({ earnings: [...state.earnings, e] })),

      // Dark mode
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'salon-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
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
