import * as React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Clock, MapPin, Calendar, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course } from '@/hooks/useCourses';
import { useCourseBatches } from '@/hooks/useCourseBatches';
import { usePrefetch } from '@/hooks/usePrefetch';
import { getOptimizedUrl } from '@/lib/imageUtils';

const difficultyStyles: Record<Course['difficulty'], string> = {
  beginner: 'bg-success/15 text-success border-success/30',
  intermediate: 'bg-accent/15 text-accent border-accent/30',
  advanced: 'bg-destructive/10 text-destructive border-destructive/30',
};

const modeLabel: Record<Course['mode'], string> = {
  online: 'Online',
  onsite: 'On-site',
  hybrid: 'Hybrid',
};

function formatShort(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
}

interface CourseCardProps extends React.HTMLAttributes<HTMLAnchorElement> {
  course: Course;
}

export const CourseCard = React.forwardRef<HTMLAnchorElement, CourseCardProps>(
  ({ course, className, ...rest }, ref) => {
    const { data: batches } = useCourseBatches(course.id);
    const nextBatch = batches?.find((b) => b.status === 'open' || b.status === 'filling') ?? null;
    const isFree = course.price <= 0;
    const prefetch = usePrefetch(`/course/${course.id}`);
    const [imgError, setImgError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    const thumbSrc = course.thumbnail_url
      ? getOptimizedUrl(course.thumbnail_url, 'medium')
      : '';
    const showImage = !!thumbSrc && !imgError;

    return (
      <Link
        ref={ref}
        to={`/course/${course.id}`}
        {...prefetch}
        className={cn(
          'group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl',
          className,
        )}
        {...rest}
      >
        <Card className="h-full overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
          <div className="relative aspect-video bg-gradient-to-br from-primary/15 to-accent/15 overflow-hidden">
            {/* Always-present branded fallback (under image) */}
            <div className="absolute inset-0 flex items-center justify-center text-primary/40">
              <GraduationCap className="h-10 w-10 sm:h-14 sm:w-14" />
            </div>

            {showImage && (
              <img
                src={thumbSrc}
                alt={course.title}
                width={640}
                height={360}
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={cn(
                  'absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300',
                  imgLoaded ? 'opacity-100' : 'opacity-0',
                )}
              />
            )}

            <Badge
              variant="outline"
              className={cn(
                'absolute top-1.5 left-1.5 sm:top-2 sm:left-2 capitalize backdrop-blur-md text-[10px] sm:text-xs px-1.5 py-0',
                difficultyStyles[course.difficulty],
              )}
            >
              {course.difficulty}
            </Badge>
            {isFree && (
              <Badge className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-success text-success-foreground border-transparent gap-1 backdrop-blur-md text-[10px] sm:text-xs px-1.5 py-0">
                <Sparkles className="h-3 w-3" /> Free
              </Badge>
            )}
          </div>
          <CardContent className="p-3 sm:p-4 space-y-2">
            <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
              {course.title}
            </h3>
            {course.audience && (
              <p className="hidden sm:block text-xs text-muted-foreground line-clamp-1">
                {course.audience}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 pt-0.5">
              {course.duration_label && (
                <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 font-normal px-1.5 py-0">
                  <Clock className="h-3 w-3" /> {course.duration_label}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 font-normal px-1.5 py-0">
                <MapPin className="h-3 w-3" /> {modeLabel[course.mode]}
              </Badge>
              {course.provides_certificate && (
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex text-xs gap-1 font-normal px-1.5 py-0"
                >
                  <Award className="h-3 w-3" /> Certificate
                </Badge>
              )}
            </div>

            {nextBatch && (
              <p className="hidden sm:inline-flex text-xs text-primary font-medium items-center gap-1 pt-0.5">
                <Calendar className="h-3 w-3" />
                Next: {formatShort(nextBatch.start_date) ?? 'TBA'}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
              {isFree ? (
                <p className="text-base sm:text-lg font-bold text-success">Free</p>
              ) : (
                <p className="text-base sm:text-lg font-bold text-primary">৳{course.price}</p>
              )}
              <span className="text-[11px] sm:text-xs font-semibold text-primary-foreground bg-primary px-2.5 py-1 rounded-full group-hover:bg-primary/90 transition-colors whitespace-nowrap">
                View
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  },
);
CourseCard.displayName = 'CourseCard';

export default CourseCard;
