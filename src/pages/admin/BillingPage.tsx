import { useStore } from '@/lib/store';
import { Plan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { Check, Sparkles, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const PLANS: Array<{ id: Plan; name: string; price: number; features: string[]; locations: string }> = [
  {
    id: 'essentials',
    name: 'Essentials',
    price: 165,
    locations: '1 location',
    features: ['Online booking', 'Calendar & scheduling', 'Up to 10 staff', 'Client database', 'Email support'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 245,
    locations: 'Up to 3 locations',
    features: ['Everything in Essentials', 'Marketing campaigns', 'Loyalty & rewards', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 375,
    locations: 'Unlimited locations',
    features: ['Everything in Standard', 'Payroll & commissions', 'Two-way SMS', 'White-label portal', 'API access'],
  },
];

export default function BillingPage() {
  const { organizations, currentOrgId, subscribe } = useStore();
  const org = organizations.find(o => o.id === currentOrgId);
  if (!org) return null;

  const isTrialing = org.subscriptionStatus === 'trialing';
  const isActive = org.subscriptionStatus === 'active';
  const msRemaining = new Date(org.trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const expired = isTrialing && daysLeft <= 0;

  function handleSubscribe(plan: Plan) {
    subscribe(plan);
    toast.success(`Subscribed to ${plan} plan. (Demo — real Stripe checkout in production.)`);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Billing & Plans" description="Manage your subscription and billing details." />

      {/* Status card */}
      <div className={`p-6 rounded-2xl border ${
        expired
          ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
          : isTrialing
            ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
            : 'border-primary/20 bg-primary/5'
      }`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {expired
                ? <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                : <Sparkles className="h-5 w-5 text-primary" />}
              <h2 className="font-semibold text-lg capitalize">{org.plan} plan</h2>
              <Badge variant="outline" className="capitalize">{org.subscriptionStatus.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {expired
                ? 'Your trial has ended. Subscribe to continue using Luxe Glow.'
                : isTrialing
                  ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your free trial.`
                  : isActive
                    ? 'Your subscription is active.'
                    : 'Subscription needs attention.'}
            </p>
          </div>
          {isTrialing && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Trial ends</div>
              <div className="font-medium text-sm">{new Date(org.trialEndsAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Choose a plan</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(p => {
            const isCurrent = org.plan === p.id && isActive;
            return (
              <Card
                key={p.id}
                className={isCurrent ? 'border-primary shadow-md' : 'border-border/60'}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-lg font-bold">{p.name}</h4>
                    {isCurrent && <Badge>Current</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.locations}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${p.price}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 flex-1">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={isCurrent ? 'outline' : 'default'}
                    disabled={isCurrent}
                    onClick={() => handleSubscribe(p.id)}
                  >
                    {isCurrent ? 'Current plan' : isTrialing ? 'Start subscription' : 'Switch to ' + p.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Demo mode — production will redirect to Stripe Checkout. Cancel or change plans anytime.
        </p>
      </div>
    </div>
  );
}
