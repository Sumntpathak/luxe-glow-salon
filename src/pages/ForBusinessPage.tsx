import { Link } from 'react-router-dom';
import { Sparkles, Check, Calendar, Users, BarChart3, Zap, Shield, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLANS = [
  {
    name: 'Essentials',
    price: 165,
    desc: 'For new salons getting started',
    cta: 'Start free trial',
    highlight: false,
    locations: '1 location',
    features: [
      'Online booking',
      'Calendar & scheduling',
      'Up to 10 staff',
      'Client database',
      'Basic reporting',
      'Email support',
    ],
  },
  {
    name: 'Standard',
    price: 245,
    desc: 'Most popular for growing salons',
    cta: 'Start free trial',
    highlight: true,
    locations: 'Up to 3 locations',
    features: [
      'Everything in Essentials',
      'Marketing campaigns (SMS + Email)',
      'Loyalty & rewards program',
      'Advanced analytics',
      'Inventory management',
      'Priority support',
    ],
  },
  {
    name: 'Unlimited',
    price: 375,
    desc: 'For multi-location chains',
    cta: 'Start free trial',
    highlight: false,
    locations: 'Unlimited locations',
    features: [
      'Everything in Standard',
      'Payroll & commissions',
      'Two-way SMS (Connect)',
      'White-label client portal',
      'API access',
      'Dedicated account manager',
    ],
  },
];

const FEATURES = [
  { icon: Calendar, title: 'Express Booking', desc: 'Multi-service, multi-staff bookings in one streamlined flow.' },
  { icon: Users, title: 'Multi-location', desc: 'Run every salon from one account. Shared client timelines.' },
  { icon: BarChart3, title: 'Real analytics', desc: 'Revenue, retention, and staff performance — at a glance.' },
  { icon: Zap, title: 'Auto service flow', desc: 'Appointments self-progress from check-in to checkout.' },
  { icon: MessageSquare, title: 'Two-way messaging', desc: 'Confirmations, reminders, and replies — without leaving the app.' },
  { icon: Shield, title: 'Built for trust', desc: 'Bank-grade encryption, role-based access, audit logs.' },
];

export default function ForBusinessPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">Luxe Glow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium hover:text-primary">Sign in</Link>
            <Link to="/vendor-signup">
              <Button size="sm">Start free trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="h-3 w-3" /> 14-day free trial · No credit card required
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            The salon software <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">your team will love.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Booking, scheduling, payments, marketing, and multi-location management — all in one beautifully designed platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link to="/vendor-signup">
              <Button size="lg" className="w-full sm:w-auto">Start your 14-day free trial</Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">See it in action</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to run a modern salon</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">From the front desk to the back office. Built for salons of every size.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/40 transition">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">Simple, predictable pricing</h2>
            <p className="text-muted-foreground">Start with a 14-day free trial. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`p-8 rounded-2xl border bg-card flex flex-col ${
                  p.highlight ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' : 'border-border/60'
                }`}
              >
                {p.highlight && (
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Most popular</div>
                )}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${p.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.locations}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/vendor-signup" className="mt-8">
                  <Button className="w-full" variant={p.highlight ? 'default' : 'outline'}>{p.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to glow?</h2>
          <p className="text-muted-foreground">Join thousands of salons already running on Luxe Glow.</p>
          <Link to="/vendor-signup">
            <Button size="lg">Start your free trial</Button>
          </Link>
          <p className="text-xs text-muted-foreground">No credit card · Setup in under 5 minutes · Cancel anytime</p>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>© 2026 Luxe Glow. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-foreground">Demo salon</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
