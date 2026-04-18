import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ProductSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-square w-full rounded-none" />
    <CardContent className="p-4 space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

export default ProductSkeleton;
