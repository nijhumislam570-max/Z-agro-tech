import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course } from '@/hooks/useCourses';

const difficultyStyles: Record<Course['difficulty'], string> = {
  beginner: 'bg-success/15 text-success border-success/30',
  intermediate: 'bg-accent/15 text-accent border-accent/30',
  advanced: 'bg-destructive/10 text-destructive border-destructive/30',
};

export const CourseCard = ({ course }: { course: Course }) => {
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
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          )}
          <div className="flex items-center justify-between pt-2">
            <p className="text-lg font-bold text-primary">
              {course.price > 0 ? `৳${course.price}` : 'Free'}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Self-paced
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CourseCard;
