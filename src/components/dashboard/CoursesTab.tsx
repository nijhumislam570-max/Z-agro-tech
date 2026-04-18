import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, PlayCircle } from 'lucide-react';
import { useMyEnrollments } from '@/hooks/useEnrollments';

export const CoursesTab = () => {
  const { data: enrollments, isLoading } = useMyEnrollments();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
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
            <p className="text-sm text-muted-foreground mt-1">Enroll in a course to start learning.</p>
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
      {enrollments.map((e) => (
        <Card key={e.id} className="overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground line-clamp-1">
                  {e.course?.title ?? 'Untitled course'}
                </h4>
                {e.course?.difficulty && (
                  <Badge variant="outline" className="mt-1 capitalize text-xs">
                    {e.course.difficulty}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{e.progress}%</span>
              </div>
              <Progress value={e.progress} className="h-2" />
            </div>
            {e.course && (
              <Link to={`/course/${e.course.id}`}>
                <Button size="sm" variant="secondary" className="w-full gap-2">
                  <PlayCircle className="h-4 w-4" /> Continue
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CoursesTab;
