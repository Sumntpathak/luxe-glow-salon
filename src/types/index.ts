export type Role = 'admin' | 'staff' | 'consumer';

// ── SaaS tenancy ────────────────────────────────────────────────────────────
export type Plan = 'trial' | 'essentials' | 'standard' | 'unlimited';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: Plan;
  trialEndsAt: string;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId?: string;
  createdAt: string;
}

export interface Location {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  logoUrl: string;
  workingHours: WorkingHours;
  bookingRules: BookingRules;
  isActive: boolean;
  createdAt: string;
}

export interface BookingRules {
  minAdvanceHours: number;
  maxFutureDays: number;
  cancellationWindowHours: number;
}

// ── Users ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  orgId: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string;
  createdAt: string;
}

export interface Staff extends User {
  role: 'staff';
  locationIds: string[];
  bio: string;
  specialties: string[];
  commissionPercent: number;
  rating: number;
  isActive: boolean;
  workingHours: WorkingHours;
  blockedDates: string[];
}

export interface Client extends User {
  role: 'consumer';
  primaryLocationId: string;
  preferences: string;
  allergies: string;
  loyaltyPoints: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold';
  referralCode: string;
}

export interface Admin extends User {
  role: 'admin';
}

// ── Domain ──────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  orgId: string;
  locationIds: string[];
  name: string;
  category: ServiceCategory;
  duration: number;
  price: number;
  description: string;
  photoUrl: string;
  assignableStaff: string[];
  isActive: boolean;
}

export type ServiceCategory = 'Hair' | 'Nails' | 'Skin';

export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  orgId: string;
  locationId: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  date: string;
  time: string;
  endTime: string;
  status: BookingStatus;
  notes: string;
  createdAt: string;
}

export interface Product {
  id: string;
  orgId: string;
  locationId: string;
  name: string;
  category: string;
  stockLevel: number;
  reorderThreshold: number;
  price: number;
}

export interface Campaign {
  id: string;
  orgId: string;
  name: string;
  type: 'SMS' | 'Email';
  targetSegment: 'all' | 'new' | 'lapsed' | 'gold' | 'silver' | 'bronze';
  messageBody: string;
  status: 'draft' | 'sent';
  openRate: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  orgId: string;
  code: string;
  discountPercent: number;
  expiryDate: string;
  isActive: boolean;
}

export interface LoyaltySettings {
  pointsPerCurrencyUnit: number;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
}

export interface SalonSettings {
  name: string;
  address: string;
  phone: string;
  logoUrl: string;
  workingHours: WorkingHours;
  bookingRules: BookingRules;
  loyaltySettings: LoyaltySettings;
}

export interface WorkingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  open: string;
  close: string;
}

export interface PointsHistory {
  id: string;
  orgId: string;
  clientId: string;
  points: number;
  reason: string;
  date: string;
}

export interface Reward {
  id: string;
  orgId: string;
  name: string;
  description: string;
  pointsCost: number;
  discountPercent: number;
}

export interface Earning {
  id: string;
  orgId: string;
  locationId: string;
  staffId: string;
  bookingId: string;
  serviceAmount: number;
  commissionAmount: number;
  tips: number;
  date: string;
}
