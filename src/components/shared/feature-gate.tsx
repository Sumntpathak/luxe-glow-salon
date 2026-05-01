import { ReactNode } from 'react';
import { useStore } from '@/lib/store';
import { Plan } from '@/types';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PLAN_RANK: Record<Plan, number> = {
  trial: 0,
  essentials: 1,
  standard: 2,
  unlimited: 3,
};

interface FeatureGateProps {
  plan: Plan;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ plan, children, fallback }: FeatureGateProps) {
  const { organizations, currentOrgId } = useStore();
  const org = organizations.find(o => o.id === currentOrgId);
  const currentRank = org ? PLAN_RANK[org.plan] : 0;
  const requiredRank = PLAN_RANK[plan];

  if (currentRank >= requiredRank) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border bg-muted/40">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-medium text-sm">Available on {plan} plan</p>
        <p className="text-xs text-muted-foreground">Upgrade to unlock this feature</p>
      </div>
      <Link
        to="/admin/billing"
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
      >
        See plans
      </Link>
    </div>
  );
}
