import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Clock, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course } from '@/hooks/useCourses';
import { useCourseBatches } from '@/hooks/useCourseBatches';

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
  } catch { return null; }
}

export const CourseCard = ({ course }: { course: Course }) => {
  const { data: batches } = useCourseBatches(course.id);
  const nextBatch = batches?.find((b) => b.status === 'open' || b.status === 'filling') ?? null;

  return (
    <Link to={`/course/${course.id}`} className="group block">
      <Card className="h-full overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-hover transition-all duration-300">
        <div className="relative aspect-video bg-gradient-to-br from-primary/15 to-accent/15 overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/40">
              <GraduationCap className="h-16 w-16" />
            </div>
          )}
          <Badge
            variant="outline"
            className={cn('absolute top-2 left-2 capitalize backdrop-blur-md', difficultyStyles[course.difficulty])}
          >
            {course.difficulty}
          </Badge>
        </div>
        <CardContent className="p-4 space-y-2.5">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          {course.audience && (
            <p className="text-xs text-muted-foreground line-clamp-1">{course.audience}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {course.duration_label && (
              <Badge variant="outline" className="text-xs gap-1 font-normal">
                <Clock className="h-3 w-3" /> {course.duration_label}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs gap-1 font-normal">
              <MapPin className="h-3 w-3" /> {modeLabel[course.mode]}
            </Badge>
          </div>

          {nextBatch && (
            <p className="text-xs text-primary font-medium inline-flex items-center gap-1 pt-1">
              <Calendar className="h-3 w-3" />
              Next batch: {formatShort(nextBatch.start_date) ?? 'TBA'}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <p className="text-lg font-bold text-primary">
              {course.price > 0 ? `৳${course.price}` : 'Free'}
            </p>
            {course.provides_certificate && (
              <span className="text-xs text-muted-foreground">Certificate</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CourseCard;
