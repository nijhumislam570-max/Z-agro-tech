import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Layout-matched skeleton for RecentOrdersList rows.
 * Prevents CLS by reserving the same row height as a real order row.
 */
export const RecentOrdersSkeleton = memo(({ count = 5 }: { count?: number }) => (
  <div className="space-y-2" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-2.5 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-muted/30 border border-transparent gap-2 sm:gap-3"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-3 w-20 sm:w-24" />
            <Skeleton className="h-2.5 w-24 sm:w-28" />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Skeleton className="h-5 w-12 sm:w-16 rounded-full" />
          <Skeleton className="h-3.5 w-10 sm:w-12" />
        </div>
      </div>
    ))}
  </div>
));

RecentOrdersSkeleton.displayName = 'RecentOrdersSkeleton';
