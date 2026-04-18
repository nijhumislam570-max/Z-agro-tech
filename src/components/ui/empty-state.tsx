import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Render inside a dashed Card wrapper (default true). */
  bordered?: boolean;
}

/**
 * Shared empty-state primitive. Use for "no orders", "no wishlist", "no search
 * results", etc. Keeps spacing, icon size, and copy hierarchy consistent.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  bordered = true,
}: EmptyStateProps) => {
  const body = (
    <div className={cn('text-center py-10 sm:py-12 px-4 space-y-4', className)}>
      <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center" aria-hidden="true">
        <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-display font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );

  if (!bordered) return body;
  return (
    <Card className="border-dashed">
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  );
};

export default EmptyState;
