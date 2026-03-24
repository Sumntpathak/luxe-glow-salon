import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  completed: { label: 'Completed', className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-semibold border', config.className)}>
      {config.label}
    </Badge>
  );
}
