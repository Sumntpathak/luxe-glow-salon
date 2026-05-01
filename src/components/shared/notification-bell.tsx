import { useState } from 'react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, Sparkles, X, type LucideIcon } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  timestamp: string;
  icon: LucideIcon;
  iconClass?: string;
}

const INITIAL_NOTIFICATIONS: ReadonlyArray<Notification> = [
  { id: 'n1', title: 'Low stock: Moisturizer SPF 30', timestamp: '2 min ago', icon: AlertCircle, iconClass: 'text-amber-500' },
  { id: 'n2', title: 'New booking: Client X',          timestamp: '14 min ago', icon: Bell },
  { id: 'n3', title: 'Trial: 13 days remaining',       timestamp: '1 hr ago',   icon: Sparkles, iconClass: 'text-primary' },
];

export default function NotificationBell() {
  const [items, setItems] = useState<ReadonlyArray<Notification>>(INITIAL_NOTIFICATIONS);
  const unread = items.length;

  const dismiss = (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative size-9" aria-label="Notifications" />
        }
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <div className="px-1.5 py-1 flex items-center justify-between">
          <span className="text-sm font-medium">Notifications</span>
          {unread > 0 && <span className="text-xs text-muted-foreground">{unread} new</span>}
        </div>
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">All caught up</div>
        ) : (
          <ul className="space-y-0.5">
            {items.map(n => {
              const Icon = n.icon;
              return (
                <li
                  key={n.id}
                  className="flex items-start gap-2 rounded-md px-1.5 py-2 hover:bg-accent/50 group"
                >
                  <Icon className={`size-4 mt-0.5 shrink-0 ${n.iconClass ?? 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.timestamp}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(n.id)}
                    aria-label="Dismiss notification"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
