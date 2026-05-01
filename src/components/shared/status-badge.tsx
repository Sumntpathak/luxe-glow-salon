import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
  checked_in: { label: 'Checked in', className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  in_service: { label: 'In service', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' },
  completed:  { label: 'Completed',  className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
  no_show:    { label: 'No-show',    className: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-semibold border', config.className)}>
      {config.label}
    </Badge>
  );
}
