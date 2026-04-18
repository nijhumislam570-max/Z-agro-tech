import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  /** Show a mobile card-style list instead of a table grid. */
  variant?: 'table' | 'cards';
}

/**
 * Generic admin loader. Use in any list page while fetching to avoid blank
 * flashes. Defaults to 6 rows × 5 cols, matching most admin tables.
 */
export const TableSkeleton = ({
  rows = 6,
  columns = 5,
  variant = 'table',
}: TableSkeletonProps) => {
  if (variant === 'cards') {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3"
          >
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
      {/* Desktop rows */}
      <div className="hidden sm:block">
        <div className="grid border-b bg-muted/40 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 w-20" />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={r}
              className="grid px-4 py-4 items-center"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }}
            >
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton key={c} className={c === 0 ? 'h-4 w-3/4' : 'h-4 w-1/2'} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
