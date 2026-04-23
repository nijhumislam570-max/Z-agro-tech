import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { getCourseImage } from '@/lib/agriImages';
import { usePrefetch } from '@/hooks/usePrefetch';

export default function LearningPathTile() {
  const { data, isLoading } = useMyEnrollments();
  const latest = data?.[0];
  const prefetchAcademy = usePrefetch('/academy');
  const prefetchCourse = usePrefetch(latest?.course_id ? `/course/${latest.course_id}` : '/academy');

  return (
    <Card className="col-span-1 lg:col-span-5 h-full flex flex-col rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </span>
          Continue your masterclass
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2 w-full" />
          </div>
        ) : !latest ? (
          <div className="rounded-xl bg-secondary/40 border border-dashed border-border p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No enrollments yet. Start your Smart Farming journey.
            </p>
            <Button asChild size="sm">
              <Link to="/academy" {...prefetchAcademy}>Explore Masterclasses</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-secondary/40 border border-border/60 group">
              <img
                src={latest.course?.thumbnail_url || getCourseImage(latest.course?.title, null)}
                alt={latest.course?.title ?? 'Course'}
                width={640}
                height={360}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <Badge className="absolute top-2 left-2 bg-card text-foreground hover:bg-card capitalize border border-border shadow-sm">
                {latest.status ?? 'pending'}
              </Badge>
            </div>
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {latest.course?.title?.slice(0, 2).toUpperCase() ?? 'CO'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                  {latest.course?.title ?? 'Course'}
                </h4>
                {latest.batch?.name && (
                  <p className="text-xs text-muted-foreground">Batch · {latest.batch.name}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-semibold text-foreground">{latest.progress ?? 0}%</span>
              </div>
              <Progress value={latest.progress ?? 0} className="h-2" />
            </div>
            <Button asChild className="w-full">
              <Link to={`/course/${latest.course_id}`} {...prefetchCourse}>
                Continue Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
