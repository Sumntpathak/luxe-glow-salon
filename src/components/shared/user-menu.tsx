import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  User, Settings, CreditCard, LogOut, HelpCircle, LayoutGrid,
} from 'lucide-react';
import { AppsGrid } from './apps-grid';

const HELP_URL = '#';

export default function UserMenu() {
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const [appsOpen, setAppsOpen] = useState(false);

  if (!currentUser) return null;

  const initial = currentUser.name?.charAt(0)?.toUpperCase() ?? '?';
  const isAdmin = currentUser.role === 'admin';
  const profileHref = isAdmin ? '/admin/settings' : `/${currentUser.role}/profile`;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleHelpClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (HELP_URL === '#') {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.log('[UserMenu] Help & Support placeholder — wire to real URL');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="size-9 rounded-full bg-gradient-to-br from-primary to-accent text-white text-sm font-semibold flex items-center justify-center shadow-sm shadow-primary/20 hover:ring-2 hover:ring-primary/40 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="User menu"
        >
          {initial}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-2">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            <Badge variant="secondary" className="mt-1.5 capitalize text-[10px]">
              {currentUser.role}
            </Badge>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(profileHref)}>
            <User /> My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
            <Settings /> Settings
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate('/admin/billing')}>
              <CreditCard /> Billing
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAppsOpen(true)}>
            <LayoutGrid /> Apps
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a
                href={HELP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleHelpClick}
              />
            }
          >
            <HelpCircle /> Help & Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AppsGrid open={appsOpen} onOpenChange={setAppsOpen} />
    </>
  );
}
