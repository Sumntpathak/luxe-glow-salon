import { Role } from '@/types';
import { Sidebar } from './sidebar';

interface PortalLayoutProps {
  children: React.ReactNode;
  role: Role;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
