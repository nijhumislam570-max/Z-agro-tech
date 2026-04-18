import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton matching the ExplorePetCard layout for smooth loading transitions
 */
export function PetCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Cover Photo */}
      <Skeleton className="h-28 sm:h-32 md:h-36 w-full" />

      {/* Content area with avatar overlap */}
      <div className="pt-12 sm:pt-14 pb-4 px-3 sm:px-4 relative">
        {/* Avatar skeleton - positioned overlapping cover */}
        <div className="absolute -top-10 sm:-top-12 left-3 sm:left-4">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
        </div>

        {/* Name & Follow row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 sm:h-9 rounded-md shrink-0" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 mb-2.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function PetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <PetCardSkeleton key={i} />
      ))}
    </div>
  );
}
