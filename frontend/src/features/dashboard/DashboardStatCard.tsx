import type { ElementType } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

export interface DashboardStatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: ElementType;
  iconClassName: string;
}

export function DashboardStatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconClassName,
}: DashboardStatCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                changeType === 'positive' && 'text-green-600 dark:text-green-500',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-muted-foreground',
              )}
            >
              {change}
            </p>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              iconClassName,
            )}
          >
            <Icon className="h-6 w-6" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
