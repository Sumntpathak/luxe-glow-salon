// Single source of truth for tier / category color tokens.
// Keep this small and dependency-free — just className strings.

import type { Client } from '@/types';

export type LoyaltyTier = Client['loyaltyTier']; // 'Bronze' | 'Silver' | 'Gold'

/** Pill / badge classes per loyalty tier. Used in tables, profile, badges. */
export const TIER_BADGE_CLASS: Record<LoyaltyTier, string> = {
  Gold:   'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
  Silver: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
  Bronze: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
};
