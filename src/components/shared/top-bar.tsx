import { useState } from 'react';
import { Sparkles, Search, Sun, Moon, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useStore } from '@/lib/store';
import { LocationSwitcher } from '@/components/shared/location-switcher';
import NavTabs from '@/components/shared/nav-tabs';
import NotificationBell from '@/components/shared/notification-bell';
import UserMenu from '@/components/shared/user-menu';
import type { Role } from '@/types';

interface TopBarProps {
  role: Role;
}

export default function TopBar({ role }: TopBarProps) {
  const { darkMode, toggleDarkMode } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearchClick = (): void => {
    // Placeholder — Cmd+K palette wiring lands in a follow-up ticket.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('luxe:open-search'));
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 glass bg-card/70 border-b border-border/40">
      <div className="h-full px-4 sm:px-6 flex items-center gap-4">
        {/* Logo cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:inline text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Luxe Glow
          </span>
        </div>

        {/* Desktop: location switcher + tabs */}
        <div className="hidden md:flex items-center gap-3 h-full">
          <LocationSwitcher />
          <NavTabs role={role} />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right cluster */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={handleSearchClick}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          <NotificationBell />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <UserMenu />

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="px-3 pb-4 space-y-3">
                <LocationSwitcher />
                <NavTabs role={role} vertical onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
