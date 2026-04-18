import { Skeleton } from '@/components/ui/skeleton';

const ProductCardSkeleton = () => (
  <div className="bg-card rounded-lg sm:rounded-xl overflow-hidden shadow-card border border-border">
    <Skeleton className="aspect-square w-full" />
    <div className="p-1.5 sm:p-2.5 space-y-1.5 sm:space-y-2">
      <Skeleton className="h-3 sm:h-4 w-3/4" />
      <Skeleton className="h-3 sm:h-4 w-1/2" />
      <Skeleton className="h-4 sm:h-5 w-1/3" />
      <Skeleton className="h-6 sm:h-8 w-full rounded-md sm:rounded-lg" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export default ProductCardSkeleton;
