import { FlowTrigger } from '@/types';
import {
  UserPlus, CheckCircle2, AlertTriangle, Cake, Crown,
  ShoppingCart, Sparkles, Clock, type LucideIcon,
} from 'lucide-react';

export interface TriggerMeta {
  id: FlowTrigger;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Categorization for filtering/grouping in the editor. */
  category: 'lifecycle' | 'retention' | 'service' | 'commerce';
}

export const TRIGGERS: ReadonlyArray<TriggerMeta> = [
  {
    id: 'client_created',
    label: 'New client created',
    description: 'Fires the moment a new client record is added to your salon.',
    icon: UserPlus,
    category: 'lifecycle',
  },
  {
    id: 'first_appointment_completed',
    label: 'First appointment completed',
    description: 'Fires after a client\'s very first visit is marked completed.',
    icon: CheckCircle2,
    category: 'lifecycle',
  },
  {
    id: 'lapsed_60d',
    label: 'Lapsed (60 days)',
    description: 'Fires when a client hasn\'t booked in 60+ days.',
    icon: AlertTriangle,
    category: 'retention',
  },
  {
    id: 'birthday',
    label: 'Birthday',
    description: 'Fires on the morning of a client\'s birthday.',
    icon: Cake,
    category: 'retention',
  },
  {
    id: 'membership_expiring',
    label: 'Membership expiring soon',
    description: 'Fires 7 days before a client\'s membership renews.',
    icon: Crown,
    category: 'commerce',
  },
  {
    id: 'cart_abandoned',
    label: 'Cart abandoned',
    description: 'Fires when an Express Booking link is opened but not confirmed.',
    icon: ShoppingCart,
    category: 'commerce',
  },
  {
    id: 'post_service',
    label: 'Post-service',
    description: 'Fires after a service is completed (configurable delay).',
    icon: Sparkles,
    category: 'service',
  },
  {
    id: 'pre_service',
    label: 'Pre-service',
    description: 'Fires a configured number of hours before an appointment.',
    icon: Clock,
    category: 'service',
  },
];

export function triggerMeta(t: FlowTrigger): TriggerMeta {
  const found = TRIGGERS.find((x) => x.id === t);
  return found ?? TRIGGERS[0];
}
