import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import { getAppsGrid } from '@/lib/nav/registry';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface AppsGridProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppsGrid({ open, onOpenChange }: AppsGridProps) {
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  if (!currentUser) return null;

  const items = getAppsGrid(currentUser.role);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apps</DialogTitle>
          <DialogDescription>Quick access to all sections.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.href)}
                className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-5 text-foreground" />
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
