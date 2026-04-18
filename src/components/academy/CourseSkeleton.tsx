import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const CourseSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-video w-full rounded-none" />
    <CardContent className="p-4 space-y-2">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardContent>
  </Card>
);

export default CourseSkeleton;
