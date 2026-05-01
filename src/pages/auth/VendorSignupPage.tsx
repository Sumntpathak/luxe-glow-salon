import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Sparkles, Check, ArrowRight, ArrowLeft, Building2, MapPin, ListChecks, Rocket } from 'lucide-react';

const step1Schema = z.object({
  orgName: z.string().min(2, 'Business name is required'),
  ownerName: z.string().min(2, 'Your name is required'),
  ownerEmail: z.string().email('Valid email required'),
  ownerPhone: z.string().min(7, 'Phone is required'),
  password: z.string().min(8, 'At least 8 characters'),
});

const step2Schema = z.object({
  locationName: z.string().min(2, 'Location name is required'),
  locationAddress: z.string().min(5, 'Full address is required'),
  locationPhone: z.string().min(7, 'Phone is required'),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;

const SERVICE_PRESETS = [
  { id: 'haircut', label: 'Haircut', category: 'Hair' },
  { id: 'color', label: 'Hair Coloring', category: 'Hair' },
  { id: 'blowout', label: 'Blowout', category: 'Hair' },
  { id: 'manicure', label: 'Manicure', category: 'Nails' },
  { id: 'pedicure', label: 'Pedicure', category: 'Nails' },
  { id: 'facial', label: 'Facial', category: 'Skin' },
  { id: 'waxing', label: 'Waxing', category: 'Skin' },
  { id: 'massage', label: 'Massage', category: 'Skin' },
];

const STEPS = [
  { num: 1, label: 'Account', icon: Building2 },
  { num: 2, label: 'Location', icon: MapPin },
  { num: 3, label: 'Services', icon: ListChecks },
  { num: 4, label: 'Launch', icon: Rocket },
];

export default function VendorSignupPage() {
  const navigate = useNavigate();
  const signupOrganization = useStore(s => s.signupOrganization);
  const [step, setStep] = useState(1);

  const [s1, setS1] = useState<Step1>({ orgName: '', ownerName: '', ownerEmail: '', ownerPhone: '', password: '' });
  const [s2, setS2] = useState<Step2>({ locationName: '', locationAddress: '', locationPhone: '' });
  const [selectedServices, setSelectedServices] = useState<string[]>(['haircut', 'manicure']);

  function next() {
    if (step === 1) {
      const r = step1Schema.safeParse(s1);
      if (!r.success) return toast.error(r.error.issues[0].message);
    }
    if (step === 2) {
      const r = step2Schema.safeParse(s2);
      if (!r.success) return toast.error(r.error.issues[0].message);
    }
    setStep(step + 1);
  }

  function finish() {
    const { org } = signupOrganization({
      orgName: s1.orgName,
      ownerName: s1.ownerName,
      ownerEmail: s1.ownerEmail,
      ownerPhone: s1.ownerPhone,
      locationName: s2.locationName,
      locationAddress: s2.locationAddress,
      locationPhone: s2.locationPhone,
    });
    toast.success(`Welcome to ${org.name}! Your 14-day trial has started.`);
    navigate('/admin/dashboard');
  }

  function toggleService(id: string) {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="px-4 py-4 border-b border-border/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/for-business" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold">Luxe Glow</span>
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Already have an account?</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                    step > s.num
                      ? 'bg-primary text-primary-foreground'
                      : step === s.num
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted'
                  }`}>
                    {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <header className="space-y-1">
                <h2 className="text-2xl font-bold">Create your account</h2>
                <p className="text-sm text-muted-foreground">Tell us about your salon and yourself.</p>
              </header>
              <div className="space-y-2">
                <Label htmlFor="orgName">Business name *</Label>
                <Input id="orgName" value={s1.orgName} onChange={e => setS1({ ...s1, orgName: e.target.value })} placeholder="e.g. Bella's Beauty Bar" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Your name *</Label>
                  <Input id="ownerName" value={s1.ownerName} onChange={e => setS1({ ...s1, ownerName: e.target.value })} placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Phone *</Label>
                  <Input id="ownerPhone" value={s1.ownerPhone} onChange={e => setS1({ ...s1, ownerPhone: e.target.value })} placeholder="+1 555 0100" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email *</Label>
                <Input id="ownerEmail" type="email" value={s1.ownerEmail} onChange={e => setS1({ ...s1, ownerEmail: e.target.value })} placeholder="jane@bellas.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={s1.password} onChange={e => setS1({ ...s1, password: e.target.value })} placeholder="At least 8 characters" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <header className="space-y-1">
                <h2 className="text-2xl font-bold">Add your first location</h2>
                <p className="text-sm text-muted-foreground">Where will clients book? You can add more locations later.</p>
              </header>
              <div className="space-y-2">
                <Label htmlFor="locName">Location name *</Label>
                <Input id="locName" value={s2.locationName} onChange={e => setS2({ ...s2, locationName: e.target.value })} placeholder={s1.orgName ? `${s1.orgName} — Downtown` : 'e.g. Bella\'s — Downtown'} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locAddr">Street address *</Label>
                <Input id="locAddr" value={s2.locationAddress} onChange={e => setS2({ ...s2, locationAddress: e.target.value })} placeholder="123 Main St, City, State 12345" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locPhone">Phone *</Label>
                <Input id="locPhone" value={s2.locationPhone} onChange={e => setS2({ ...s2, locationPhone: e.target.value })} placeholder="+1 555 0200" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <header className="space-y-1">
                <h2 className="text-2xl font-bold">Pick your services</h2>
                <p className="text-sm text-muted-foreground">Get started with templates. You can customize prices and add more later.</p>
              </header>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICE_PRESETS.map(s => {
                  const on = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        on ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{s.label}</span>
                        {on && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{s.category}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Selected: {selectedServices.length} services. You can skip and add later.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <header className="space-y-1">
                <h2 className="text-2xl font-bold">Ready to launch?</h2>
                <p className="text-sm text-muted-foreground">Your 14-day free trial starts today — no credit card required.</p>
              </header>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3 text-sm">
                <Row label="Business" value={s1.orgName} />
                <Row label="Owner" value={`${s1.ownerName} · ${s1.ownerEmail}`} />
                <Row label="Location" value={`${s2.locationName} — ${s2.locationAddress}`} />
                <Row label="Services" value={`${selectedServices.length} selected`} />
                <Row label="Plan" value="14-day free trial · Standard features" />
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4 text-primary" /> What happens next</div>
                <ul className="space-y-1 text-muted-foreground text-xs ml-6 list-disc">
                  <li>You land in your admin dashboard</li>
                  <li>Add staff and start taking bookings immediately</li>
                  <li>We'll email you on day 10 before the trial ends</li>
                </ul>
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/50">
            <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 4 ? (
              <Button onClick={next}>
                {step === 3 ? 'Review' : 'Continue'} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish}>
                Start free trial <Rocket className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
