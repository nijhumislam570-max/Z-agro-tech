import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { CMSArticle } from '@/hooks/useCMS';

export const ArticleCard = ({ article }: { article: CMSArticle }) => {
  const date = article.published_at || article.created_at;
  const [loaded, setLoaded] = useState(false);

  return (
    <Link to={`/blog/${article.slug}`} className="group">
      <Card className="overflow-hidden h-full transition-shadow hover:shadow-lg border-border/50">
        <div className="aspect-video overflow-hidden bg-muted relative">
          {article.featured_image ? (
            <>
              {!loaded && <Skeleton className="absolute inset-0" />}
              <img
                src={article.featured_image}
                alt={article.title}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                decoding="async"
                width={400}
                height={225}
                onLoad={() => setLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <span className="text-4xl opacity-30">📝</span>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] capitalize">{article.category.replace('-', ' ')}</Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(date), 'MMM d, yyyy')}
            </span>
          </div>
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};