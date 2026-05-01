import { Role } from '@/types';
import { Sidebar } from './sidebar';
import { TrialBanner } from './trial-banner';
import TopBar from './top-bar';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: Role;
}

export function PortalLayout({ children, role }: PortalLayoutProps) {
  // Admin uses the Mangomint-style top-bar shell.
  // Staff and consumer continue with the legacy sidebar (until Epic 1 expands).
  if (role === 'admin') {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar role={role} />
        <TrialBanner />
        <main className="flex-1 pt-14 px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
