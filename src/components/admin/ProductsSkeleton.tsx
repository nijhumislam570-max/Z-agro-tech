import { Skeleton } from '@/components/ui/skeleton';

export function ProductsStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border border-border bg-card">
          <Skeleton className="h-4 w-4 sm:h-5 sm:w-5 rounded-full" />
          <Skeleton className="h-5 w-8 sm:h-6 sm:w-10" />
          <Skeleton className="h-3 w-12 sm:w-14" />
        </div>
      ))}
    </div>
  );
}

export function ProductsTableSkeleton() {
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
      {/* Mobile skeleton */}
      <div className="sm:hidden divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 flex gap-3">
            <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop skeleton */}
      <div className="hidden sm:block">
        <div className="p-4 border-b">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border-b flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
