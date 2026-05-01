import { Link } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Sparkles, AlertTriangle } from 'lucide-react';

export function TrialBanner() {
  const { organizations, currentOrgId } = useStore();
  const org = organizations.find(o => o.id === currentOrgId);
  if (!org || org.subscriptionStatus !== 'trialing') return null;

  const msRemaining = new Date(org.trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const expired = daysLeft <= 0;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm border-b ${
        expired
          ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-100'
          : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-100'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {expired
          ? <AlertTriangle className="h-4 w-4 shrink-0" />
          : <Sparkles className="h-4 w-4 shrink-0" />}
        <span className="truncate">
          {expired
            ? <>Your trial ended. Subscribe to continue using {org.name}.</>
            : <><strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong> left in your free trial.</>}
        </span>
      </div>
      <Link
        to="/admin/billing"
        className="shrink-0 px-3 py-1 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 transition"
      >
        {expired ? 'Subscribe now' : 'Upgrade plan'}
      </Link>
    </div>
  );
}
