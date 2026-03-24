

import { Toaster } from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const darkMode = useStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-card !text-card-foreground !border !border-border',
          duration: 3000,
        }}
      />
    </>
  );
}
