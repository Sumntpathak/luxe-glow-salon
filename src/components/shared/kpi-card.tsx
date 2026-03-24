import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function KPICard({ title, value, icon: Icon, description, trend, className }: KPICardProps) {
  return (
    <Card className={cn('hover:shadow-lg hover:shadow-primary/5 transition-all duration-300', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <p className={cn('text-xs font-semibold', trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                {trend.positive ? '+' : ''}{trend.value}% from last week
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
