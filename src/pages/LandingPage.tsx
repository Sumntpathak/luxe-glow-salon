import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star, Clock, MapPin, Phone, Mail, ChevronRight,
  Sparkles, Heart, Shield, Sun, Moon, ArrowRight,
  Scissors, Palette, Droplets,
} from 'lucide-react';

const HERO_SERVICES = [
  { icon: Scissors, label: 'Hair', desc: 'Cuts, Color & Styling' },
  { icon: Palette, label: 'Nails', desc: 'Manicure & Nail Art' },
  { icon: Droplets, label: 'Skin', desc: 'Facials & Treatments' },
];

const TRUST_POINTS = [
  { icon: Sparkles, text: 'Premium Products' },
  { icon: Heart, text: '10,000+ Happy Clients' },
  { icon: Shield, text: 'Licensed Professionals' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { services, staff, darkMode, toggleDarkMode, salonSettings } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Hair', 'Nails', 'Skin'];
  const filteredServices = activeCategory === 'All'
    ? services.filter(s => s.isActive)
    : services.filter(s => s.isActive && s.category === activeCategory);

  const activeStaff = staff.filter(s => s.isActive);

  const categoryIcon = (cat: string) => {
    if (cat === 'Hair') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
    if (cat === 'Nails') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  };

  return (
    <div className="min-h-screen">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass bg-card/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{salonSettings.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm">
            {[
              { href: '#services', label: 'Services' },
              { href: '#team', label: 'Our Team' },
              { href: '#reviews', label: 'Reviews' },
              { href: '#contact', label: 'Contact' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex h-9 px-4 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors items-center"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/book')}
              className="h-9 px-5 rounded-full text-sm font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:brightness-110 transition-all inline-flex items-center gap-1.5"
            >
              Book Now <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl section-fade">
            <Badge variant="secondary" className="mb-6 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase">
              Now Accepting Bookings
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-balance">
              Where beauty meets
              <span className="bg-gradient-to-r from-primary via-pink-400 to-accent bg-clip-text text-transparent"> artistry</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
              Experience bespoke hair, nail, and skincare services crafted by award-winning
              stylists in the heart of the city.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/book')}
                className="rounded-full px-8 h-12 text-base font-semibold glow-pink-lg hover:glow-pink-lg"
              >
                Book Your Visit <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-12 text-base border-primary/20 hover:border-primary/40"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Services
              </Button>
            </div>
            {/* Trust signals */}
            <div className="mt-12 flex flex-wrap gap-6">
              {TRUST_POINTS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick category cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 section-fade" style={{ animationDelay: '0.15s' }}>
            {HERO_SERVICES.map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                onClick={() => { setActiveCategory(label); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="group p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View services <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="py-20 px-4 sm:px-6 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Our Services</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Tailored treatments using the finest products, delivered by experts who care.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex justify-center gap-2 mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card border hover:border-primary/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredServices.map(service => (
              <Card key={service.id} className="group overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border hover:border-primary/20">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={service.photoUrl}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className={`text-[10px] font-medium ${categoryIcon(service.category)}`}>
                      {service.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{service.duration}min
                    </span>
                  </div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold">${service.price}</span>
                    <Button
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => navigate('/book', { state: { serviceId: service.id } })}
                    >
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team ─── */}
      <section id="team" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Meet Our Artists</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Passionate professionals dedicated to making you look and feel extraordinary.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeStaff.map(member => (
              <div key={member.id} className="group text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden ring-2 ring-border group-hover:ring-primary/30 transition-all">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-card border rounded-full px-2 py-0.5 shadow-sm">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{member.rating}</span>
                  </div>
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{member.bio.slice(0, 60)}...</p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {member.specialties.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px] rounded-full">{s}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Reviews ─── */}
      <section id="reviews" className="py-20 px-4 sm:px-6 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Alice W.', text: 'Absolutely stunning results every single time. Emma understood exactly what I wanted and delivered perfection.', rating: 5 },
              { name: 'Iris P.', text: 'The nail art by Mia is incredible! I always get compliments. The salon ambiance is so relaxing and elegant.', rating: 5 },
              { name: 'Eva M.', text: 'Best facial treatment I\'ve ever had. Olivia\'s attention to detail and the organic products they use are outstanding.', rating: 5 },
            ].map((review, i) => (
              <Card key={i} className="p-6 border hover:border-primary/20 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{review.text}"</p>
                <p className="mt-4 text-sm font-semibold">{review.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-3xl overflow-hidden p-12 sm:p-16" style={{ background: 'linear-gradient(135deg, #d6336c 0%, #c2185b 40%, #e91e63 70%, #f48fb1 100%)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 50%), radial-gradient(circle at 70% 80%, white 0%, transparent 50%)' }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Ready to glow?</h2>
              <p className="mt-4 text-white/85 max-w-md mx-auto text-lg">
                Book your appointment today and experience the Luxe Glow difference.
                No account needed.
              </p>
              <button
                onClick={() => navigate('/book')}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-primary px-10 h-12 text-base font-bold shadow-xl hover:shadow-2xl hover:bg-white/95 transition-all duration-200"
              >
                Book Your Appointment <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact / Footer ─── */}
      <footer id="contact" className="border-t bg-card py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold">{salonSettings.name}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Where beauty meets artistry. Premium salon services in a refined, welcoming atmosphere.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Visit Us</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{salonSettings.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{salonSettings.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>hello@luxeglow.com</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to="/book" className="block text-muted-foreground hover:text-foreground transition-colors">Book Appointment</Link>
                <Link to="/my-bookings" className="block text-muted-foreground hover:text-foreground transition-colors">My Bookings</Link>
                <Link to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">Staff & Admin Login</Link>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {salonSettings.name}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
