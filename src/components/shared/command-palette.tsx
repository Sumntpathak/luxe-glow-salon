import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Moon, LogOut, UserPlus } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useStore } from '@/lib/store';
import { getAllNav, navInitials, type NavItem } from '@/lib/nav/registry';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const recentNavIds = useStore((s) => s.recentNavIds);
  const pushRecentNav = useStore((s) => s.pushRecentNav);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const logout = useStore((s) => s.logout);

  const role = currentUser?.role ?? 'consumer';
  const navItems = useMemo<NavItem[]>(() => getAllNav(role), [role]);

  const recentItems = useMemo<NavItem[]>(() => {
    return recentNavIds
      .map((id) => navItems.find((n) => n.id === id))
      .filter((n): n is NavItem => Boolean(n));
  }, [recentNavIds, navItems]);

  // Cmd+K (mac) / Ctrl+K toggles, Esc closes (handled by Dialog).
  // Also listens for the `luxe:open-search` event dispatched from the TopBar search button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('luxe:open-search', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('luxe:open-search', onOpen);
    };
  }, []);

  const handleNavigate = useCallback(
    (item: NavItem) => {
      pushRecentNav(item.id);
      setOpen(false);
      navigate(item.href);
    },
    [navigate, pushRecentNav],
  );

  const handleToggleDarkMode = useCallback(() => {
    toggleDarkMode();
    setOpen(false);
  }, [toggleDarkMode]);

  const handleLogout = useCallback(() => {
    logout();
    setOpen(false);
    navigate('/');
  }, [logout, navigate]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      className="sm:max-w-[640px]"
      title="Command palette"
      description="Search navigation and quick actions"
    >
      <CommandInput placeholder="Type a command or search…" autoFocus />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recentItems.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentItems.map((item) => {
                const Icon = item.icon;
                const initials = navInitials(item);
                return (
                  <CommandItem
                    key={`recent-${item.id}`}
                    value={`${item.label} ${initials} recent`}
                    onSelect={() => handleNavigate(item)}
                  >
                    <Clock className="text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <Icon className="text-muted-foreground" />
                    <CommandShortcut>
                      <kbd className="rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                        {initials}
                      </kbd>
                    </CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const initials = navInitials(item);
            return (
              <CommandItem
                key={item.id}
                value={`${item.label} ${initials}`}
                onSelect={() => handleNavigate(item)}
              >
                <Icon />
                <span className="flex-1">{item.label}</span>
                <CommandShortcut>
                  <kbd className="rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    {initials}
                  </kbd>
                </CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {currentUser && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick actions">
              {currentUser.role === 'admin' && (
                <CommandItem
                  value="New client add create"
                  onSelect={() => {
                    setOpen(false);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('luxe:open-quick-add-client'));
                    }
                  }}
                >
                  <UserPlus />
                  <span className="flex-1">New client</span>
                </CommandItem>
              )}
              <CommandItem
                value="Toggle dark mode theme appearance"
                onSelect={handleToggleDarkMode}
              >
                <Moon />
                <span className="flex-1">Toggle dark mode</span>
              </CommandItem>
              <CommandItem
                value="Sign out logout"
                onSelect={handleLogout}
              >
                <LogOut />
                <span className="flex-1">Sign out</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
