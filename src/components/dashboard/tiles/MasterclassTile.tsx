import { Link } from 'react-router-dom';
import { GlassCard } from '../GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useFeaturedMasterclass } from '@/hooks/useDashboardData';

export default function MasterclassTile() {
  const { data, isLoading } = useFeaturedMasterclass();

  return (
    <GlassCard className="col-span-1 lg:col-span-4 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Featured Masterclass
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl bg-white/20" />
        ) : !data ? (
          <div className="rounded-xl bg-white/10 border border-dashed border-white/30 p-6 text-center space-y-3">
            <p className="text-sm text-white/85">
              New masterclasses are coming soon.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/academy">Browse Academy</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="aspect-video rounded-xl overflow-hidden bg-white/10 border border-white/15">
              {data.thumbnail_url ? (
                <img
                  src={data.thumbnail_url}
                  alt={data.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white/50" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-white/90 text-foreground capitalize hover:bg-white/90 text-[10px]">
                  {data.difficulty}
                </Badge>
                {data.duration_label && (
                  <Badge variant="outline" className="border-white/40 text-white text-[10px]">
                    {data.duration_label}
                  </Badge>
                )}
                {data.mode && (
                  <Badge variant="outline" className="border-white/40 text-white text-[10px] capitalize">
                    {data.mode}
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-semibold text-white line-clamp-2">{data.title}</h4>
              {data.description && (
                <p className="text-xs text-white/75 line-clamp-2">{data.description}</p>
              )}
            </div>
            <Button asChild variant="secondary" className="w-full">
              <Link to={`/academy/${data.id}`}>
                Enroll Now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </GlassCard>
  );
}
