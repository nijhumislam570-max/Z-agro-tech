import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useFeaturedMasterclass } from '@/hooks/useDashboardData';
import { getCourseImage } from '@/lib/agriImages';
import { usePrefetch } from '@/hooks/usePrefetch';

function difficultyClass(level: string) {
  const l = level.toLowerCase();
  if (l.includes('begin'))
    return 'bg-success-soft text-success-foreground border-success-border hover:bg-success-soft';
  if (l.includes('inter'))
    return 'bg-warning-soft text-warning-foreground border-warning-border hover:bg-warning-soft';
  if (l.includes('adv'))
    return 'bg-danger-soft text-danger border-danger-border hover:bg-danger-soft';
  return 'bg-secondary text-secondary-foreground border-border hover:bg-secondary';
}

export default function MasterclassTile() {
  const { data, isLoading } = useFeaturedMasterclass();
  const prefetchAcademy = usePrefetch('/academy');
  const prefetchCourse = usePrefetch(data?.id ? `/course/${data.id}` : '/academy');

  return (
    <Card className="col-span-1 lg:col-span-4 h-full flex flex-col rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          Featured Masterclass
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : !data ? (
          <div className="rounded-xl bg-secondary/40 border border-dashed border-border p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              New masterclasses are coming soon.
            </p>
            <Button asChild size="sm">
              <Link to="/academy" {...prefetchAcademy}>Browse Academy</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="aspect-video rounded-xl overflow-hidden bg-secondary/40 border border-border/60">
              <img
                src={data.thumbnail_url || getCourseImage(data.title, data.category)}
                alt={data.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={`${difficultyClass(data.difficulty)} capitalize text-[10px]`}>
                  {data.difficulty}
                </Badge>
                {data.duration_label && (
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                    {data.duration_label}
                  </Badge>
                )}
                {data.mode && (
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px] capitalize">
                    {data.mode}
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-semibold text-foreground line-clamp-2">{data.title}</h4>
              {data.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>
              )}
            </div>
            <Button asChild className="w-full">
              <Link to={`/course/${data.id}`} {...prefetchCourse}>
                Enroll Now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
