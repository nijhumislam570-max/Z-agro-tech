import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Calendar, Clock } from 'lucide-react';
import { useMyEnrollments, type EnrollmentStatus } from '@/hooks/useEnrollments';
import { cn } from '@/lib/utils';

const statusStyle: Record<EnrollmentStatus, string> = {
  pending: 'bg-accent/15 text-accent border-accent/30',
  confirmed: 'bg-primary/15 text-primary border-primary/30',
  completed: 'bg-success/15 text-success border-success/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const statusLabel: Record<EnrollmentStatus, string> = {
  pending: 'Pending review',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return null; }
}

export const CoursesTab = () => {
  const { data: enrollments, isLoading } = useMyEnrollments();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">No courses yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Enroll in a training cohort to start learning.</p>
          </div>
          <Link to="/academy">
            <Button className="gap-2"><GraduationCap className="h-4 w-4" /> Browse academy</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {enrollments.map((e) => {
        const status = (e.status as EnrollmentStatus) ?? 'pending';
        const batchDate = formatDate(e.batch?.start_date);
        const progress = Math.min(100, Math.max(0, e.progress ?? 0));
        const showProgress = status === 'confirmed' || status === 'completed';
        return (
          <Card
            key={e.id}
            className="overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-hover hover:border-primary/40"
          >
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground line-clamp-1">
                    {e.course?.title ?? 'Untitled course'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant="outline" className={cn('text-xs', statusStyle[status])}>
                      {statusLabel[status]}
                    </Badge>
                    {e.course?.duration_label && (
                      <Badge variant="outline" className="text-xs gap-1 font-normal">
                        <Clock className="h-3 w-3" /> {e.course.duration_label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {e.batch && (
                <div className="rounded-lg bg-muted/40 p-2.5 text-xs">
                  <p className="font-medium text-foreground">{e.batch.name}</p>
                  {batchDate && (
                    <p className="text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" /> Starts {batchDate}
                    </p>
                  )}
                </div>
              )}

              {showProgress && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Progress</span>
                    <span className="font-bold text-primary">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" aria-label="Course completion" />
                </div>
              )}

              {e.course && (
                <Link to={`/course/${e.course.id}`}>
                  <Button size="sm" variant="secondary" className="w-full">
                    View course
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CoursesTab;
