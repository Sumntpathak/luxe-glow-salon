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
  /** Hex color applied as the primary brand token across the app (MGN-904). */
  primaryColor?: string;
  /** Public logo URL applied to top-bar, online booking page, emails. */
  logoUrl?: string;
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
  /** Free-form tags (e.g. "VIP", "color-specialist", "weekend-only"). */
  tags?: string[];
  /** Admin-facing notes about the client; not visible to the client themselves. */
  adminNotes?: string;
  /** Cards on file for one-tap checkout (mock — production uses Stripe). */
  savedCards?: SavedCard[];
}

/** Tag taxonomy for filtering — managed in Settings later. */
export interface ClientTag {
  id: string;
  orgId: string;
  label: string;
  color: 'gray' | 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
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

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'no_show';

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
  /** Internal-only notes visible to staff but not the client. */
  privateNotes?: string;
  /** Express Booking groups multiple sequential services under one shared id. */
  groupId?: string;
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
  /** Sales tax rate as a decimal (0.08875 = 8.875%). Defaults to NYC. */
  taxRate?: number;
  /** Auto-reminder configuration (Epic 7 / MGN-703). */
  reminderSettings?: ReminderSettings;
}

// ── Checkout / POS ─────────────────────────────────────────────────────────
export type PaymentMethod = 'card' | 'cash' | 'gift_card' | 'other';

export interface SavedCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  /** Discount applied to this line in dollars (already subtracted from line total). */
  discount: number;
  /** Booking id when the line came from a service; product id for retail. */
  refId?: string;
  kind: 'service' | 'product' | 'fee';
}

export interface ReceiptPayment {
  method: PaymentMethod;
  amount: number;
  /** Last4 if method=card, gift card code if method=gift_card. */
  reference?: string;
}

// ── Resources (Epic 9 / MGN-902) ───────────────────────────────────────────
export type ResourceKind = 'room' | 'chair' | 'equipment';

export interface Resource {
  id: string;
  orgId: string;
  locationId: string;
  name: string;
  kind: ResourceKind;
  isActive: boolean;
  createdAt: string;
}

// ── Permissions (Epic 9 / MGN-903) ─────────────────────────────────────────
export type PermissionRole = 'owner' | 'admin' | 'manager' | 'front_desk' | 'stylist';

export type PermissionId =
  | 'view_calendar'
  | 'edit_bookings'
  | 'cancel_bookings'
  | 'manage_clients'
  | 'manage_staff'
  | 'manage_services'
  | 'manage_inventory'
  | 'process_payments'
  | 'process_refunds'
  | 'view_reports'
  | 'manage_marketing'
  | 'manage_settings'
  | 'manage_billing';

/** Per-org override matrix: role → permissions enabled. */
export type PermissionMatrix = Partial<Record<PermissionRole, Partial<Record<PermissionId, boolean>>>>;

// ── Marketing flows (Epic 8) ───────────────────────────────────────────────
export type FlowTrigger =
  | 'client_created'
  | 'first_appointment_completed'
  | 'lapsed_60d'
  | 'birthday'
  | 'membership_expiring'
  | 'cart_abandoned'
  | 'post_service'
  | 'pre_service';

export type FlowStepKind = 'delay' | 'send_sms' | 'send_email' | 'end';

interface FlowStepBase {
  id: string;
  kind: FlowStepKind;
}

export interface DelayStep extends FlowStepBase {
  kind: 'delay';
  /** Wait amount in minutes (production engine resolves into a queued job). */
  minutes: number;
}

export interface SendSmsStep extends FlowStepBase {
  kind: 'send_sms';
  body: string;
}

export interface SendEmailStep extends FlowStepBase {
  kind: 'send_email';
  subject: string;
  body: string;
  /** Optional A/B variant on subject only (MGN-804). */
  abVariant?: { subjectB: string };
}

export interface EndStep extends FlowStepBase { kind: 'end' }

export type FlowStep = DelayStep | SendSmsStep | SendEmailStep | EndStep;

export interface FlowMetrics {
  sent: number;
  delivered: number;
  openRate: number;            // 0-100
  revenueAttributed: number;
  /** When A/B variant exists, per-variant open rate. */
  variantOpenRates?: { a: number; b: number };
}

export interface Flow {
  id: string;
  orgId: string;
  name: string;
  description: string;
  trigger: FlowTrigger;
  steps: FlowStep[];
  active: boolean;
  /** When true, this flow was activated from a starter template. */
  fromTemplate?: string;
  metrics: FlowMetrics;
  createdAt: string;
  updatedAt: string;
}

// ── Communications (Epic 7) ────────────────────────────────────────────────
export type MessageChannel = 'sms' | 'email';
export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  orgId: string;
  locationId: string;
  clientId: string;
  channel: MessageChannel;
  direction: MessageDirection;
  /** Subject line for emails; ignored for SMS. */
  subject?: string;
  body: string;
  /** ISO timestamp. */
  sentAt: string;
  /** True when the staff has marked it read. Inbound messages start unread. */
  read: boolean;
  /** Mock delivery status (production tracks via Twilio webhooks). */
  status: 'sent' | 'delivered' | 'failed' | 'received';
}

export interface ReminderSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  /** Hours before appointment to send each reminder. */
  beforeHours: number[];
}

export interface Receipt {
  id: string;
  orgId: string;
  locationId: string;
  clientId: string;
  /** When checkout originated from an appointment, the bookings paid for. */
  bookingIds: string[];
  /** When the appointment had a groupId, store it for receipt-level grouping. */
  groupId?: string;
  staffId: string;             // staff who processed checkout
  items: ReceiptLineItem[];
  subtotal: number;
  discountTotal: number;
  taxRate: number;
  tax: number;
  tip: number;
  total: number;
  payments: ReceiptPayment[];
  createdAt: string;
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
