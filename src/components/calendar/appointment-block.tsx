import { Booking, BookingStatus } from '@/types';
import { STATUS_STYLES, timeToPixels, durationToPixels } from '@/lib/calendar/utils';
import { cn } from '@/lib/utils';

// Explicit map so Tailwind's JIT scanner sees full class literals.
const STATUS_DOT: Record<BookingStatus, string> = {
  pending: 'bg-amber-500', confirmed: 'bg-blue-500',
  completed: 'bg-gray-400 dark:bg-gray-500', cancelled: 'bg-red-400',
};

interface AppointmentBlockProps {
  booking: Booking;
  client: { name: string; avatar?: string } | undefined;
  service: { name: string; duration: number } | undefined;
  onClick?: () => void;
  widthPercent?: number;
  leftPercent?: number;
}

const COMPACT_THRESHOLD_MIN = 30;

export default function AppointmentBlock({
  booking, client, service, onClick, widthPercent, leftPercent,
}: AppointmentBlockProps) {
  const styles = STATUS_STYLES[booking.status];
  const duration = service?.duration ?? 30;
  const isCompact = duration <= COMPACT_THRESHOLD_MIN;
  const width = widthPercent ?? 100;
  const left = leftPercent ?? 0;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onClick?.(); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
  };

  const clientName = client?.name ?? 'Unknown client';
  const serviceName = service?.name ?? 'Service';
  const dotColor = STATUS_DOT[booking.status];

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${clientName} — ${serviceName} at ${booking.time}`}
      style={{
        top: `${timeToPixels(booking.time)}px`,
        height: `${durationToPixels(duration)}px`,
        width: `calc(${width}% - 4px)`,
        left: `calc(${left}% + 2px)`,
      }}
      className={cn(
        'absolute z-10 flex flex-col items-stretch justify-start gap-0.5',
        'rounded-md border border-border/40 border-l-4 px-2 py-1.5 text-left',
        'cursor-pointer overflow-hidden text-ellipsis',
        'transition-all duration-150 ease-out',
        'hover:ring-1 hover:ring-foreground/20 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        styles.bg, styles.border, styles.text,
      )}
    >
      <span aria-hidden="true" className={cn('absolute right-1.5 top-1.5 size-1.5 rounded-full', dotColor)} />
      <span className="truncate pr-3 text-xs font-medium leading-tight">{clientName}</span>
      {!isCompact && (
        <>
          <span className="truncate text-[11px] leading-tight opacity-80">{serviceName}</span>
          <span className="text-[10px] leading-tight opacity-70">{booking.time} – {booking.endTime}</span>
        </>
      )}
    </button>
  );
}
