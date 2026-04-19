import { Link } from 'react-router-dom';
import { GlassCard } from '../GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <GlassCard className="col-span-1 lg:col-span-5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Continue your masterclass
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl bg-white/20" />
            <Skeleton className="h-3 w-2/3 bg-white/20" />
            <Skeleton className="h-2 w-full bg-white/20" />
          </div>
        ) : !latest ? (
          <div className="rounded-xl bg-white/10 border border-dashed border-white/30 p-6 text-center space-y-3">
            <p className="text-sm text-white/85">
              No enrollments yet. Start your Smart Farming journey.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/academy">Explore Masterclasses</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-white/10 border border-white/15 group">
              <img
                src={latest.course?.thumbnail_url || getCourseImage(latest.course?.title, null)}
                alt={latest.course?.title ?? 'Course'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <Badge className="absolute top-2 left-2 bg-white/90 text-foreground hover:bg-white/90 capitalize">
                {latest.status ?? 'pending'}
              </Badge>
            </div>
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9 border border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-xs">
                  {latest.course?.title?.slice(0, 2).toUpperCase() ?? 'CO'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white line-clamp-1">
                  {latest.course?.title ?? 'Course'}
                </h4>
                {latest.batch?.name && (
                  <p className="text-xs text-white/70">Batch · {latest.batch.name}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Progress</span>
                <span className="font-semibold">{latest.progress ?? 0}%</span>
              </div>
              <Progress value={latest.progress ?? 0} className="h-2 bg-white/15" />
            </div>
            <Button asChild className="w-full" variant="secondary">
              <Link to={`/course/${latest.course_id}`}>
                Continue Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </GlassCard>
  );
}
