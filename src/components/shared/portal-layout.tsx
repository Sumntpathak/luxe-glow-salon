import { Role } from '@/types';
import { Sidebar } from './sidebar';
import { TrialBanner } from './trial-banner';
import { LocationSwitcher } from './location-switcher';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: Role;
}

export function PortalLayout({ children, role }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        {role === 'admin' && (
          <>
            <TrialBanner />
            <div className="flex items-center justify-end gap-3 px-4 md:px-8 py-3 border-b border-border/40 bg-background">
              <LocationSwitcher />
            </div>
          </>
        )}
        <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
