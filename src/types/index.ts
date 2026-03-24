export type Role = 'admin' | 'staff' | 'consumer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar: string;
  createdAt: string;
}

export interface Staff extends User {
  role: 'staff';
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
  preferences: string;
  allergies: string;
  loyaltyPoints: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold';
  referralCode: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  duration: number; // minutes
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
  clientId: string;
  staffId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime: string;
  status: BookingStatus;
  notes: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  reorderThreshold: number;
  price: number;
}

export interface Campaign {
  id: string;
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
  bookingRules: {
    minAdvanceHours: number;
    maxFutureDays: number;
    cancellationWindowHours: number;
  };
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
  clientId: string;
  points: number;
  reason: string;
  date: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountPercent: number;
}

export interface Earning {
  id: string;
  staffId: string;
  bookingId: string;
  serviceAmount: number;
  commissionAmount: number;
  tips: number;
  date: string;
}
