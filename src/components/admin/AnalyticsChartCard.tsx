import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalyticsChartCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export const AnalyticsChartCard = ({
  title,
  description,
  icon,
  children,
  className,
  headerAction,
}: AnalyticsChartCardProps) => {
  return (
    <Card className={cn('shadow-sm border-border/50', className)}>
      <CardHeader className="p-3 sm:p-4 lg:p-5 pb-2 sm:pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base lg:text-lg truncate">{title}</CardTitle>
              {description && (
                <CardDescription className="text-[10px] sm:text-xs mt-0.5 hidden sm:block">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-5 pt-0">{children}</CardContent>
    </Card>
  );
};
