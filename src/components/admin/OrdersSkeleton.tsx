import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for a single mobile order card */
function OrderCardSkeleton() {
  return (
    <div className="p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton for desktop table rows */
function OrderTableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
      <td className="p-4"><Skeleton className="h-4 w-28" /></td>
      <td className="p-4"><Skeleton className="h-4 w-14" /></td>
      <td className="p-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
      <td className="p-4"><Skeleton className="h-4 w-14" /></td>
      <td className="p-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="p-4"><Skeleton className="h-5 w-18 rounded-full" /></td>
      <td className="p-4"><Skeleton className="h-8 w-8 rounded" /></td>
    </tr>
  );
}

/** Mobile skeleton list */
export function OrderCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="sm:hidden divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Desktop skeleton table */
export function OrderTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr>
            {['Order ID', 'Date', 'Customer', 'Items', 'Payment', 'Tracking', 'Total', 'Status', 'Risk', ''].map(h => (
              <th key={h} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }).map((_, i) => (
            <OrderTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Combined stats bar skeleton - grid layout matching unified design */
export function OrderStatsBarSkeleton() {
  return (
    <div className="mb-4 sm:mb-6 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[80px] sm:h-[90px] rounded-xl sm:rounded-2xl" />
        ))}
      </div>
    </div>
  );
}