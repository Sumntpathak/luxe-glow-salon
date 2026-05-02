import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import {
  Calendar, Users, Scissors, BarChart3, Package, Megaphone,
  Settings, LayoutDashboard, Clock, DollarSign, Star,
  User, BookOpen, Gift, Menu, X, Sun, Moon, LogOut, CreditCard, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const consumerLinks = [
  { href: '/consumer/book', label: 'Book Service', icon: BookOpen },
  { href: '/consumer/appointments', label: 'Appointments', icon: Calendar },
  { href: '/consumer/profile', label: 'Profile', icon: User },
  { href: '/consumer/rewards', label: 'Rewards', icon: Gift },
];

const staffLinks = [
  { href: '/staff/calendar', label: 'My Calendar', icon: Calendar },
  { href: '/staff/clients', label: 'My Clients', icon: Users },
  { href: '/staff/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/staff/schedule', label: 'Schedule', icon: Clock },
];

// NOTE: admin role uses TopBar (Epic 1), so adminLinks is only kept here as a
// reference / fallback. If a future surface re-enables admin sidebar mode,
// add new entries here. Legacy `/admin/bookings` is intentionally omitted —
// the calendar replaces it (route still works for back-compat).
const adminLinks = [
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/staff', label: 'Staff', icon: Scissors },
  { href: '/admin/services', label: 'Services', icon: Star },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, darkMode, toggleDarkMode, logout, products } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = currentUser?.role;
  const links = role === 'admin' ? adminLinks : role === 'staff' ? staffLinks : consumerLinks;
  const lowStockCount = products.filter(p => p.stockLevel <= p.reorderThreshold).length;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-pink-400 to-accent bg-clip-text text-transparent">
          Luxe Glow
        </h1>
        <p className="text-xs text-muted-foreground mt-1 capitalize">{role} Portal</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          const showBadge = link.href === '/admin/inventory' && lowStockCount > 0;
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{link.label}</span>
              {showBadge && (
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
                  {lowStockCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-primary/20">
            {currentUser?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
          </div>
        </div>
        <div className="flex gap-2 px-3">
          <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="flex-1">
            {darkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {darkMode ? 'Light' : 'Dark'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }} className="flex-1">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-200 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
