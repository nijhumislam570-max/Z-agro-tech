import { Skeleton } from '@/components/ui/skeleton';

/**
 * Layout-matched skeleton shown inside <AdminShell> while a route chunk loads.
 * Mimics the typical admin page structure (page header → stat row → table block)
 * so navigation feels instant with near-zero CLS.
 */
export const AdminPageSkeleton = () => {
  return (
    <div className="space-y-4 sm:space-y-6" aria-busy="true" aria-live="polite">
      {/* Page header strip */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Main content block */}
      <Skeleton className="w-full h-[420px] rounded-3xl" />
    </div>
  );
};

export default AdminPageSkeleton;
