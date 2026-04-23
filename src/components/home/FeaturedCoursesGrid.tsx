import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useCoursesNextBatches } from '@/hooks/useCourseNextBatch';
import { CourseCard } from '@/components/academy/CourseCard';
import { CourseSkeleton } from '@/components/academy/CourseSkeleton';

export const FeaturedCoursesGrid = () => {
  const { data: courses, isLoading } = useCourses({ limit: 6 });
  const courseIds = useMemo(() => (courses ?? []).map((c) => c.id), [courses]);
  const { data: nextBatches } = useCoursesNextBatches(courseIds);

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-secondary/30 to-background" aria-labelledby="featured-courses">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <GraduationCap className="h-3.5 w-3.5" /> Academy
            </p>
            <h2 id="featured-courses" className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">
              Learn from the experts
            </h2>
          </div>
          <Link to="/academy">
            <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
              All courses <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <CourseSkeleton key={i} />)
            : (courses || []).map((c) => (
                <CourseCard key={c.id} course={c} nextBatch={nextBatches?.get(c.id) ?? null} />
              ))}
        </div>

        {!isLoading && (!courses || courses.length === 0) && (
          <div className="text-center py-12 bg-card rounded-2xl border border-border/60">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No courses published yet — admins can add them from the Admin Panel.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCoursesGrid;
