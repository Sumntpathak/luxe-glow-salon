import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPrimaryNav, type NavItem } from '@/lib/nav/registry';
import type { Role } from '@/types';

interface NavTabsProps {
  role: Role;
  /** When true, render stacked vertically (mobile sheet). Defaults to false (horizontal row). */
  vertical?: boolean;
  /** Optional callback fired after tab click — used to close the mobile sheet. */
  onNavigate?: () => void;
}

export default function NavTabs({ role, vertical = false, onNavigate }: NavTabsProps) {
  const items: NavItem[] = getPrimaryNav(role);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        vertical ? 'flex flex-col gap-1' : 'hidden md:flex items-center h-full'
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                vertical
                  ? cn(
                      'px-3 py-2.5 rounded-lg',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )
                  : cn(
                      'h-full px-3 -mb-px border-b-2',
                      isActive
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
