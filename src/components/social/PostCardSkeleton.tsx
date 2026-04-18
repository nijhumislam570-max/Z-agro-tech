import { forwardRef, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const PostCardSkeleton = memo(forwardRef<HTMLElement>((_, ref) => (
  <article ref={ref} className="bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border/50 overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 pb-2 sm:pb-3">
      <Skeleton className="h-9 w-9 sm:h-11 sm:w-11 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-28 sm:w-32 rounded" />
        <Skeleton className="h-2.5 w-20 sm:w-24 rounded" />
      </div>
    </div>
    {/* Content */}
    <div className="px-3 sm:px-4 pb-2 sm:pb-3 space-y-1.5">
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
    </div>
    {/* Media placeholder */}
    <Skeleton className="w-full aspect-[4/3] sm:aspect-[16/10] rounded-none" />
    {/* Actions */}
    <div className="px-3 sm:px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-3 w-16 mt-3 rounded" />
      <Skeleton className="h-2.5 w-24 mt-2 rounded" />
    </div>
  </article>
)));

PostCardSkeleton.displayName = 'PostCardSkeleton';

export const FeedSkeletons = () => (
  <div className="space-y-3 sm:space-y-4" aria-busy="true" aria-label="Loading posts">
    <PostCardSkeleton />
    <PostCardSkeleton />
    <PostCardSkeleton />
  </div>
);
