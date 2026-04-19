import { Skeleton } from '@/components/ui/skeleton';

/**
 * Layout-matched fallback for <Suspense> on public route chunks.
 *
 * Replaces the previous behavior where Suspense fell back to the global
 * top progress bar — which left the page area blank during the JS chunk
 * download, producing a "is the app frozen?" feel on cold loads.
 *
 * Renders inside the persistent PublicShell (Navbar + Footer stay mounted),
 * so this skeleton fills only the content slot — zero CLS on hand-off.
 */
export const PublicPageSkeleton = () => (
  <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 animate-page-enter">
    {/* Header strip */}
    <div className="space-y-2">
      <Skeleton className="h-7 w-1/3 max-w-[280px]" />
      <Skeleton className="h-4 w-1/2 max-w-[420px]" />
    </div>

    {/* Filter / chips row */}
    <div className="flex gap-2 overflow-hidden">
      <Skeleton className="h-9 w-20" />
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-20" />
      <Skeleton className="h-9 w-28 hidden sm:block" />
      <Skeleton className="h-9 w-20 hidden sm:block" />
    </div>

    {/* Card grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

export default PublicPageSkeleton;
