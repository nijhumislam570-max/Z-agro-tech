import { Skeleton } from '@/components/ui/skeleton';

export const StatCardSkeleton = () => (
  <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-border shadow-sm">
    <div className="flex items-start justify-between gap-2 sm:gap-3">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-24 sm:h-8 sm:w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-lg sm:rounded-xl flex-shrink-0" />
    </div>
  </div>
);

export const ChartSkeleton = ({ height = 'h-[200px] sm:h-[280px]' }: { height?: string }) => (
  <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-4 lg:p-5">
    <div className="flex items-center gap-2 mb-4">
      <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-32 sm:w-40" />
        <Skeleton className="h-3 w-24 hidden sm:block" />
      </div>
    </div>
    <Skeleton className={`w-full ${height} rounded-lg`} />
  </div>
);

export const AnalyticsPageSkeleton = () => (
  <div className="space-y-4 sm:space-y-6">
    {/* Date filter skeleton */}
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-16 sm:w-20 rounded-lg" />
      ))}
    </div>

    {/* Revenue stat cards */}
    <div>
      <Skeleton className="h-4 w-28 mb-3" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>

    {/* Chart skeleton */}
    <ChartSkeleton height="h-[200px] sm:h-[280px] lg:h-[320px]" />

    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <ChartSkeleton height="h-[180px]" />
      <ChartSkeleton height="h-[180px]" />
    </div>

    {/* Platform overview */}
    <div>
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
