import {
  Calendar, DollarSign, Users, Megaphone, BarChart3, Package,
  CreditCard, Settings, MapPin, Inbox, Sparkles, BookOpen, Gift,
  Clock, User as UserIcon, Scissors, Star, type LucideIcon,
} from 'lucide-react';
import { Role } from '@/types';

export interface NavItem {
  id: string;
  label: string;
  /** Initials for Cmd+K matching (e.g. "GC" for "Gift Cards"). Auto-generated from label if omitted. */
  initials?: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  /** primary = visible in TopBar tabs · secondary = palette/menu only · apps = appears in apps grid */
  group: 'primary' | 'secondary' | 'apps';
}

// Single source of truth — drives TopBar tabs, Cmd+K palette, AppsGrid, and Sidebar.
export const NAV_ITEMS: NavItem[] = [
  // ── Admin primary tabs (top bar) ────────────────────────────────────────
  { id: 'calendar',  label: 'Calendar',  href: '/admin/calendar',   icon: Calendar,    roles: ['admin'], group: 'primary' },
  { id: 'sales',     label: 'Sales',     href: '/admin/dashboard',  icon: DollarSign,  roles: ['admin'], group: 'primary' },
  { id: 'clients',   label: 'Clients',   href: '/admin/clients',    icon: Users,       roles: ['admin'], group: 'primary' },
  { id: 'marketing', label: 'Marketing', href: '/admin/marketing',  icon: Megaphone,   roles: ['admin'], group: 'primary' },
  { id: 'reports',   label: 'Reports',   href: '/admin/analytics',  icon: BarChart3,   roles: ['admin'], group: 'primary' },
  { id: 'inventory', label: 'Inventory', href: '/admin/inventory',  icon: Package,     roles: ['admin'], group: 'primary' },

  // ── Admin secondary (palette + apps grid + user menu) ───────────────────
  { id: 'staff',     label: 'Staff',     href: '/admin/staff',      icon: Scissors,    roles: ['admin'], group: 'apps' },
  { id: 'services',  label: 'Services',  href: '/admin/services',   icon: Star,        roles: ['admin'], group: 'apps' },
  { id: 'locations', label: 'Locations', href: '/admin/locations',  icon: MapPin,      roles: ['admin'], group: 'apps' },
  { id: 'inbox',     label: 'Inbox',     href: '/admin/inbox',      icon: Inbox,       roles: ['admin'], group: 'apps' },
  { id: 'gift-cards',label: 'Gift Cards',href: '/admin/gift-cards', icon: Gift,        roles: ['admin'], group: 'apps', initials: 'GC' },
  { id: 'billing',   label: 'Billing',   href: '/admin/billing',    icon: CreditCard,  roles: ['admin'], group: 'secondary' },
  { id: 'settings',  label: 'Settings',  href: '/admin/settings',   icon: Settings,    roles: ['admin'], group: 'secondary' },

  // ── Staff portal ────────────────────────────────────────────────────────
  { id: 'staff-cal',     label: 'My Calendar', href: '/staff/calendar', icon: Calendar,    roles: ['staff'], group: 'primary' },
  { id: 'staff-clients', label: 'My Clients',  href: '/staff/clients',  icon: Users,       roles: ['staff'], group: 'primary' },
  { id: 'staff-earn',    label: 'Earnings',    href: '/staff/earnings', icon: DollarSign,  roles: ['staff'], group: 'primary' },
  { id: 'staff-sched',   label: 'Schedule',    href: '/staff/schedule', icon: Clock,       roles: ['staff'], group: 'primary' },

  // ── Consumer portal ─────────────────────────────────────────────────────
  { id: 'cust-book',  label: 'Book Service',  href: '/consumer/book',         icon: BookOpen, roles: ['consumer'], group: 'primary' },
  { id: 'cust-appts', label: 'Appointments',  href: '/consumer/appointments', icon: Calendar, roles: ['consumer'], group: 'primary' },
  { id: 'cust-prof',  label: 'Profile',       href: '/consumer/profile',      icon: UserIcon, roles: ['consumer'], group: 'primary' },
  { id: 'cust-rew',   label: 'Rewards',       href: '/consumer/rewards',      icon: Sparkles, roles: ['consumer'], group: 'primary' },
];

/** Items visible in the TopBar tabs row for a given role. */
export function getPrimaryNav(role: Role): NavItem[] {
  return NAV_ITEMS.filter(i => i.roles.includes(role) && i.group === 'primary');
}

/** Every item visible to this role in any context (palette, apps, menu). */
export function getAllNav(role: Role): NavItem[] {
  return NAV_ITEMS.filter(i => i.roles.includes(role));
}

/** Items shown in the Apps grid (admin only by convention). */
export function getAppsGrid(role: Role): NavItem[] {
  return NAV_ITEMS.filter(i => i.roles.includes(role) && (i.group === 'primary' || i.group === 'apps'));
}

/** Initials helper for Cmd+K matching: "Gift Cards" → "GC". */
export function navInitials(item: NavItem): string {
  if (item.initials) return item.initials;
  return item.label
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}
