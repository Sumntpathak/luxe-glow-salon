import {
  Staff, Client, Admin, Service, Booking, Product,
  Campaign, Coupon, SalonSettings, PointsHistory, Reward, Earning,
  WorkingHours, Organization, Location,
} from '@/types';

const defaultWorkingHours: WorkingHours = {
  monday: { isOpen: true, open: '09:00', close: '18:00' },
  tuesday: { isOpen: true, open: '09:00', close: '18:00' },
  wednesday: { isOpen: true, open: '09:00', close: '18:00' },
  thursday: { isOpen: true, open: '09:00', close: '18:00' },
  friday: { isOpen: true, open: '09:00', close: '20:00' },
  saturday: { isOpen: true, open: '10:00', close: '17:00' },
  sunday: { isOpen: false, open: '10:00', close: '15:00' },
};

// ── SaaS tenancy seed ──────────────────────────────────────────────────────
export const DEFAULT_ORG_ID = 'org-1';
export const DEFAULT_LOCATION_ID = 'loc-1';

const trialEndsAt = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
})();

export const organizations: Organization[] = [
  {
    id: DEFAULT_ORG_ID,
    name: 'Luxe Glow Salon',
    slug: 'luxe-glow',
    ownerId: 'admin-1',
    plan: 'trial',
    trialEndsAt,
    subscriptionStatus: 'trialing',
    createdAt: '2024-01-01',
  },
];

export const locations: Location[] = [
  {
    id: DEFAULT_LOCATION_ID,
    orgId: DEFAULT_ORG_ID,
    name: 'Luxe Glow — Manhattan',
    slug: 'manhattan',
    address: '123 Beauty Lane, Suite 100, New York, NY 10001',
    phone: '+1-555-0100',
    logoUrl: '',
    workingHours: defaultWorkingHours,
    bookingRules: {
      minAdvanceHours: 2,
      maxFutureDays: 30,
      cancellationWindowHours: 24,
    },
    isActive: true,
    createdAt: '2024-01-01',
  },
];

// Tenancy-tag helpers — all seed data belongs to the default org/location.
const tagOrg = { orgId: DEFAULT_ORG_ID };
const tagOrgLoc = { orgId: DEFAULT_ORG_ID, locationId: DEFAULT_LOCATION_ID };
const tagOrgLocs = { orgId: DEFAULT_ORG_ID, locationIds: [DEFAULT_LOCATION_ID] };

// ── Users ───────────────────────────────────────────────────────────────────
export const adminUser: Admin = {
  ...tagOrg,
  id: 'admin-1',
  name: 'Sarah Mitchell',
  email: 'admin@salon.com',
  phone: '+1-555-0100',
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  createdAt: '2024-01-01',
};

type StaffSeed = Omit<Staff, 'orgId' | 'locationIds'>;
const staffSeeds: StaffSeed[] = [
  {
    id: 'staff-1', name: 'Emma Johnson', email: 'emma@salon.com', phone: '+1-555-0201',
    role: 'staff', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    bio: 'Senior stylist with 8 years of experience in cutting-edge hair design and coloring techniques.',
    specialties: ['Hair'], commissionPercent: 40, rating: 4.9, isActive: true,
    workingHours: defaultWorkingHours, blockedDates: ['2026-04-10', '2026-04-11'], createdAt: '2024-02-01',
  },
  {
    id: 'staff-2', name: 'Mia Chen', email: 'mia@salon.com', phone: '+1-555-0202',
    role: 'staff', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia',
    bio: 'Nail art specialist passionate about creative designs and premium manicures.',
    specialties: ['Nails'], commissionPercent: 35, rating: 4.8, isActive: true,
    workingHours: defaultWorkingHours, blockedDates: [], createdAt: '2024-03-01',
  },
  {
    id: 'staff-3', name: 'Olivia Brown', email: 'olivia@salon.com', phone: '+1-555-0203',
    role: 'staff', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    bio: 'Licensed esthetician specializing in facials, peels, and advanced skincare treatments.',
    specialties: ['Skin'], commissionPercent: 38, rating: 4.7, isActive: true,
    workingHours: defaultWorkingHours, blockedDates: ['2026-04-15'], createdAt: '2024-03-15',
  },
  {
    id: 'staff-4', name: 'Sophia Davis', email: 'sophia@salon.com', phone: '+1-555-0204',
    role: 'staff', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia',
    bio: 'Multi-talented stylist skilled in hair, nails, and basic skincare services.',
    specialties: ['Hair', 'Nails'], commissionPercent: 36, rating: 4.6, isActive: true,
    workingHours: { ...defaultWorkingHours, saturday: { isOpen: false, open: '10:00', close: '17:00' } },
    blockedDates: [], createdAt: '2024-04-01',
  },
];
export const staffMembers: Staff[] = staffSeeds.map(s => ({ ...s, ...tagOrgLocs }));

type ClientSeed = Omit<Client, 'orgId' | 'primaryLocationId'>;
const clientSeeds: ClientSeed[] = [
  { id: 'client-1', name: 'Alice Walker', email: 'alice@email.com', phone: '+1-555-0301', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', preferences: 'Prefers quiet environment', allergies: 'Latex allergy', loyaltyPoints: 1250, loyaltyTier: 'Gold', referralCode: 'ALICE2024', createdAt: '2024-01-15' },
  { id: 'client-2', name: 'Bob Martin', email: 'bob@email.com', phone: '+1-555-0302', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', preferences: 'Likes detailed consultations', allergies: '', loyaltyPoints: 750, loyaltyTier: 'Silver', referralCode: 'BOB2024', createdAt: '2024-02-10' },
  { id: 'client-3', name: 'Carol White', email: 'carol@email.com', phone: '+1-555-0303', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol', preferences: 'Loves bold colors', allergies: 'Sensitive to strong fragrances', loyaltyPoints: 420, loyaltyTier: 'Bronze', referralCode: 'CAROL2024', createdAt: '2024-02-20' },
  { id: 'client-4', name: 'David Lee', email: 'david@email.com', phone: '+1-555-0304', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', preferences: 'Quick appointments preferred', allergies: '', loyaltyPoints: 980, loyaltyTier: 'Silver', referralCode: 'DAVID2024', createdAt: '2024-03-05' },
  { id: 'client-5', name: 'Eva Martinez', email: 'eva@email.com', phone: '+1-555-0305', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva', preferences: 'Organic products only', allergies: 'Parabens', loyaltyPoints: 1520, loyaltyTier: 'Gold', referralCode: 'EVA2024', createdAt: '2024-03-10' },
  { id: 'client-6', name: 'Frank Wilson', email: 'frank@email.com', phone: '+1-555-0306', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank', preferences: '', allergies: '', loyaltyPoints: 200, loyaltyTier: 'Bronze', referralCode: 'FRANK2024', createdAt: '2024-04-01' },
  { id: 'client-7', name: 'Grace Kim', email: 'grace@email.com', phone: '+1-555-0307', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace', preferences: 'Evening appointments', allergies: '', loyaltyPoints: 880, loyaltyTier: 'Silver', referralCode: 'GRACE2024', createdAt: '2024-04-15' },
  { id: 'client-8', name: 'Henry Taylor', email: 'henry@email.com', phone: '+1-555-0308', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry', preferences: 'Beard grooming expert needed', allergies: 'None', loyaltyPoints: 340, loyaltyTier: 'Bronze', referralCode: 'HENRY2024', createdAt: '2024-05-01' },
  { id: 'client-9', name: 'Iris Patel', email: 'iris@email.com', phone: '+1-555-0309', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Iris', preferences: 'Prefers Mia for nails', allergies: 'Acetone sensitivity', loyaltyPoints: 1100, loyaltyTier: 'Gold', referralCode: 'IRIS2024', createdAt: '2024-05-10' },
  { id: 'client-10', name: 'Jack Robinson', email: 'consumer@salon.com', phone: '+1-555-0310', role: 'consumer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', preferences: 'Weekend slots only', allergies: '', loyaltyPoints: 600, loyaltyTier: 'Silver', referralCode: 'JACK2024', createdAt: '2024-05-20' },
];
export const clients: Client[] = clientSeeds.map(c => ({ ...c, orgId: DEFAULT_ORG_ID, primaryLocationId: DEFAULT_LOCATION_ID }));

type ServiceSeed = Omit<Service, 'orgId' | 'locationIds'>;
const serviceSeeds: ServiceSeed[] = [
  { id: 'svc-1', name: 'Classic Haircut', category: 'Hair', duration: 45, price: 55, description: 'Precision cut with consultation, shampoo, and blow-dry.', photoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop', assignableStaff: ['staff-1', 'staff-4'], isActive: true },
  { id: 'svc-2', name: 'Hair Coloring', category: 'Hair', duration: 120, price: 150, description: 'Full color service with premium products and toner.', photoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=200&fit=crop', assignableStaff: ['staff-1', 'staff-4'], isActive: true },
  { id: 'svc-3', name: 'Blowout & Style', category: 'Hair', duration: 30, price: 40, description: 'Professional blowout with styling for any occasion.', photoUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=crop', assignableStaff: ['staff-1', 'staff-4'], isActive: true },
  { id: 'svc-4', name: 'Gel Manicure', category: 'Nails', duration: 60, price: 45, description: 'Long-lasting gel manicure with nail art options.', photoUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&h=200&fit=crop', assignableStaff: ['staff-2', 'staff-4'], isActive: true },
  { id: 'svc-5', name: 'Spa Pedicure', category: 'Nails', duration: 75, price: 60, description: 'Relaxing spa pedicure with exfoliation and massage.', photoUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=300&h=200&fit=crop', assignableStaff: ['staff-2', 'staff-4'], isActive: true },
  { id: 'svc-6', name: 'Classic Facial', category: 'Skin', duration: 60, price: 85, description: 'Deep cleansing facial with extraction and hydrating mask.', photoUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=200&fit=crop', assignableStaff: ['staff-3'], isActive: true },
  { id: 'svc-7', name: 'Chemical Peel', category: 'Skin', duration: 45, price: 120, description: 'Professional chemical peel for skin renewal and glow.', photoUrl: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=300&h=200&fit=crop', assignableStaff: ['staff-3'], isActive: true },
  { id: 'svc-8', name: 'Nail Art Design', category: 'Nails', duration: 90, price: 70, description: 'Custom nail art with premium designs and embellishments.', photoUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300&h=200&fit=crop', assignableStaff: ['staff-2'], isActive: true },
];
export const services: Service[] = serviceSeeds.map(s => ({ ...s, ...tagOrgLocs }));

// ── Bookings ────────────────────────────────────────────────────────────────
// Generate bookings RELATIVE to today so the calendar always renders rich data.
// Spread: last 7 days (mostly completed) · today (mix) · next 14 days (confirmed/pending).
function generateBookings(): Booking[] {
  const out: Booking[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Stable pseudo-random for repeatable demo data (seed: day-of-year so it changes nightly).
  const seed = today.getDate() + today.getMonth() * 31;
  let _r = seed;
  const rand = () => {
    _r = (_r * 9301 + 49297) % 233280;
    return _r / 233280;
  };
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

  const fmtDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const addDays = (d: Date, n: number) => {
    const out = new Date(d);
    out.setDate(out.getDate() + n);
    return out;
  };
  const addMin = (time: string, mins: number) => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  // Slot starting times (15-min granularity, business hours 09:00 – 18:30).
  const slotStarts: string[] = [];
  for (let h = 9; h < 19; h++) for (let m = 0; m < 60; m += 30) slotStarts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

  const clientIds = ['client-1', 'client-2', 'client-3', 'client-4', 'client-5', 'client-6', 'client-7', 'client-8', 'client-9', 'client-10'] as const;
  const serviceIds = serviceSeeds.map(s => s.id);
  const staffIds = ['staff-1', 'staff-2', 'staff-3', 'staff-4'] as const;

  // Per-day booking density (more on weekdays, fewer on Sunday).
  const densityFor = (dayOffset: number): number => {
    const d = addDays(today, dayOffset);
    const dow = d.getDay(); // 0 = Sun
    if (dow === 0) return 3;
    if (dow === 6) return 6;
    return 8;
  };

  let bookingNum = 1;
  const tryAdd = (dayOffset: number, status: Booking['status']) => {
    const date = addDays(today, dayOffset);
    const time = pick(slotStarts);
    const serviceId = pick(serviceIds);
    const svc = serviceSeeds.find(s => s.id === serviceId)!;
    // Pick a staff who can perform this service.
    const eligible = staffIds.filter(sid => svc.assignableStaff.includes(sid));
    if (eligible.length === 0) return;
    const staffId = pick(eligible);
    const endTime = addMin(time, svc.duration);
    // Reject if conflict on same staff for that date.
    const conflict = out.some(b =>
      b.staffId === staffId && b.date === fmtDate(date) &&
      time < b.endTime && endTime > b.time,
    );
    if (conflict) return;
    out.push({
      ...tagOrgLoc,
      id: `bk-${bookingNum++}`,
      clientId: pick(clientIds),
      staffId,
      serviceId,
      date: fmtDate(date),
      time,
      endTime,
      status,
      notes: '',
      createdAt: fmtDate(addDays(date, -1)),
    });
  };

  // Last week: completed (with the occasional cancellation)
  for (let off = -7; off < 0; off++) {
    const n = densityFor(off);
    for (let i = 0; i < n; i++) tryAdd(off, rand() < 0.1 ? 'cancelled' : 'completed');
  }

  // Today: mix — mornings completed, midday confirmed, afternoon pending (gives visual variety)
  const todayCount = densityFor(0);
  for (let i = 0; i < todayCount; i++) {
    const r = rand();
    const status: Booking['status'] = r < 0.3 ? 'completed' : r < 0.7 ? 'confirmed' : 'pending';
    tryAdd(0, status);
  }

  // Next 14 days: mostly confirmed, some pending, rare cancelled
  for (let off = 1; off <= 14; off++) {
    const n = densityFor(off);
    for (let i = 0; i < n; i++) {
      const r = rand();
      const status: Booking['status'] = r < 0.65 ? 'confirmed' : r < 0.95 ? 'pending' : 'cancelled';
      tryAdd(off, status);
    }
  }

  return out;
}

export const bookings: Booking[] = generateBookings();

// ── Products ────────────────────────────────────────────────────────────────
type ProductSeed = Omit<Product, 'orgId' | 'locationId'>;
const productSeeds: ProductSeed[] = [
  { id: 'prod-1', name: 'Shampoo - Hydrating', category: 'Hair Care', stockLevel: 24, reorderThreshold: 10, price: 18 },
  { id: 'prod-2', name: 'Conditioner - Repair', category: 'Hair Care', stockLevel: 18, reorderThreshold: 10, price: 20 },
  { id: 'prod-3', name: 'Hair Color - Blonde', category: 'Hair Color', stockLevel: 8, reorderThreshold: 10, price: 25 },
  { id: 'prod-4', name: 'Hair Color - Brown', category: 'Hair Color', stockLevel: 12, reorderThreshold: 10, price: 25 },
  { id: 'prod-5', name: 'Gel Polish - Red', category: 'Nail Products', stockLevel: 15, reorderThreshold: 5, price: 12 },
  { id: 'prod-6', name: 'Gel Polish - Pink', category: 'Nail Products', stockLevel: 3, reorderThreshold: 5, price: 12 },
  { id: 'prod-7', name: 'Cuticle Oil', category: 'Nail Products', stockLevel: 20, reorderThreshold: 8, price: 8 },
  { id: 'prod-8', name: 'Facial Cleanser', category: 'Skincare', stockLevel: 14, reorderThreshold: 8, price: 22 },
  { id: 'prod-9', name: 'Moisturizer SPF 30', category: 'Skincare', stockLevel: 2, reorderThreshold: 5, price: 35 },
  { id: 'prod-10', name: 'Chemical Peel Solution', category: 'Skincare', stockLevel: 6, reorderThreshold: 4, price: 45 },
  { id: 'prod-11', name: 'Styling Mousse', category: 'Hair Care', stockLevel: 1, reorderThreshold: 5, price: 16 },
  { id: 'prod-12', name: 'Heat Protectant Spray', category: 'Hair Care', stockLevel: 22, reorderThreshold: 8, price: 14 },
];
export const products: Product[] = productSeeds.map(p => ({ ...p, ...tagOrgLoc }));

// ── Marketing ───────────────────────────────────────────────────────────────
type CampaignSeed = Omit<Campaign, 'orgId'>;
const campaignSeeds: CampaignSeed[] = [
  { id: 'camp-1', name: 'Spring Special', type: 'Email', targetSegment: 'all', messageBody: 'Enjoy 20% off all services this spring! Book now and glow up.', status: 'sent', openRate: 34.5, createdAt: '2026-03-01' },
  { id: 'camp-2', name: 'Welcome Back', type: 'SMS', targetSegment: 'lapsed', messageBody: 'We miss you! Come back and get a free blowout with any service.', status: 'sent', openRate: 28.2, createdAt: '2026-03-10' },
  { id: 'camp-3', name: 'Gold Member Exclusive', type: 'Email', targetSegment: 'gold', messageBody: 'As a Gold member, enjoy priority booking and 15% off this month.', status: 'draft', openRate: 0, createdAt: '2026-03-20' },
];
export const campaigns: Campaign[] = campaignSeeds.map(c => ({ ...c, ...tagOrg }));

type CouponSeed = Omit<Coupon, 'orgId'>;
const couponSeeds: CouponSeed[] = [
  { id: 'coup-1', code: 'SPRING20', discountPercent: 20, expiryDate: '2026-04-30', isActive: true },
  { id: 'coup-2', code: 'WELCOME10', discountPercent: 10, expiryDate: '2026-05-31', isActive: true },
  { id: 'coup-3', code: 'VIP15', discountPercent: 15, expiryDate: '2026-04-15', isActive: false },
];
export const coupons: Coupon[] = couponSeeds.map(c => ({ ...c, ...tagOrg }));

// ── Salon settings (legacy single-location config; phased out in Sprint 3) ─
export const salonSettings: SalonSettings = {
  name: 'Luxe Glow Salon',
  address: '123 Beauty Lane, Suite 100, New York, NY 10001',
  phone: '+1-555-0100',
  logoUrl: '',
  workingHours: defaultWorkingHours,
  bookingRules: {
    minAdvanceHours: 2,
    maxFutureDays: 30,
    cancellationWindowHours: 24,
  },
  loyaltySettings: {
    pointsPerCurrencyUnit: 1,
    bronzeThreshold: 0,
    silverThreshold: 500,
    goldThreshold: 1000,
  },
};

// ── Loyalty / earnings ─────────────────────────────────────────────────────
type PointsSeed = Omit<PointsHistory, 'orgId'>;
const pointsSeeds: PointsSeed[] = [
  { id: 'ph-1', clientId: 'client-1', points: 55, reason: 'Classic Haircut booking', date: '2026-03-10' },
  { id: 'ph-2', clientId: 'client-1', points: 150, reason: 'Hair Coloring booking', date: '2026-03-20' },
  { id: 'ph-3', clientId: 'client-2', points: 45, reason: 'Gel Manicure booking', date: '2026-03-10' },
  { id: 'ph-4', clientId: 'client-5', points: 60, reason: 'Spa Pedicure booking', date: '2026-03-13' },
  { id: 'ph-5', clientId: 'client-10', points: 45, reason: 'Gel Manicure booking', date: '2026-03-19' },
  { id: 'ph-6', clientId: 'client-9', points: 70, reason: 'Nail Art Design booking', date: '2026-03-18' },
  { id: 'ph-7', clientId: 'client-7', points: 120, reason: 'Chemical Peel booking', date: '2026-03-15' },
  { id: 'ph-8', clientId: 'client-10', points: 100, reason: 'Referral bonus', date: '2026-03-15' },
];
export const pointsHistory: PointsHistory[] = pointsSeeds.map(p => ({ ...p, ...tagOrg }));

type RewardSeed = Omit<Reward, 'orgId'>;
const rewardSeeds: RewardSeed[] = [
  { id: 'rw-1', name: '10% Off Next Visit', description: 'Get 10% discount on your next booking', pointsCost: 200, discountPercent: 10 },
  { id: 'rw-2', name: '20% Off Any Service', description: 'Save 20% on any single service', pointsCost: 400, discountPercent: 20 },
  { id: 'rw-3', name: 'Free Blowout', description: 'Complimentary blowout & style service', pointsCost: 300, discountPercent: 100 },
  { id: 'rw-4', name: 'VIP Treatment Upgrade', description: 'Upgrade any service to the premium version', pointsCost: 500, discountPercent: 25 },
];
export const rewards: Reward[] = rewardSeeds.map(r => ({ ...r, ...tagOrg }));

type EarningSeed = Omit<Earning, 'orgId' | 'locationId'>;
const earningSeeds: EarningSeed[] = [
  { id: 'earn-1', staffId: 'staff-1', bookingId: 'bk-1', serviceAmount: 55, commissionAmount: 22, tips: 10, date: '2026-03-10' },
  { id: 'earn-2', staffId: 'staff-2', bookingId: 'bk-2', serviceAmount: 45, commissionAmount: 15.75, tips: 8, date: '2026-03-10' },
  { id: 'earn-3', staffId: 'staff-3', bookingId: 'bk-3', serviceAmount: 85, commissionAmount: 32.30, tips: 15, date: '2026-03-11' },
  { id: 'earn-4', staffId: 'staff-1', bookingId: 'bk-4', serviceAmount: 150, commissionAmount: 60, tips: 20, date: '2026-03-12' },
  { id: 'earn-5', staffId: 'staff-2', bookingId: 'bk-5', serviceAmount: 60, commissionAmount: 21, tips: 10, date: '2026-03-13' },
  { id: 'earn-6', staffId: 'staff-3', bookingId: 'bk-7', serviceAmount: 120, commissionAmount: 45.60, tips: 18, date: '2026-03-15' },
  { id: 'earn-7', staffId: 'staff-1', bookingId: 'bk-8', serviceAmount: 55, commissionAmount: 22, tips: 8, date: '2026-03-17' },
  { id: 'earn-8', staffId: 'staff-2', bookingId: 'bk-9', serviceAmount: 70, commissionAmount: 24.50, tips: 12, date: '2026-03-18' },
  { id: 'earn-9', staffId: 'staff-4', bookingId: 'bk-10', serviceAmount: 45, commissionAmount: 16.20, tips: 7, date: '2026-03-19' },
  { id: 'earn-10', staffId: 'staff-1', bookingId: 'bk-11', serviceAmount: 150, commissionAmount: 60, tips: 25, date: '2026-03-20' },
];
export const earnings: Earning[] = earningSeeds.map(e => ({ ...e, ...tagOrgLoc }));
