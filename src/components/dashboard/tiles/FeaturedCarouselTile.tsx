import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { Star, ArrowRight, ShoppingCart, GraduationCap } from 'lucide-react';
import { useFeaturedAgri, type FeaturedItem } from '@/hooks/useFeaturedAgri';
import { getCourseImage, getProductImage } from '@/lib/agriImages';

function difficultyTone(level: string) {
  const l = level.toLowerCase();
  if (l.includes('begin'))
    return 'bg-success-soft text-success-foreground border-success-border hover:bg-success-soft';
  if (l.includes('inter'))
    return 'bg-warning-soft text-warning-foreground border-warning-border hover:bg-warning-soft';
  if (l.includes('adv'))
    return 'bg-danger-soft text-danger border-danger-border hover:bg-danger-soft';
  return 'bg-secondary text-secondary-foreground border-border hover:bg-secondary';
}

function stockTone(stock: number | null) {
  const s = stock ?? 0;
  if (s <= 0)
    return { label: 'Out of Stock', cls: 'bg-danger-soft text-danger border-danger-border hover:bg-danger-soft' };
  if (s < 5)
    return { label: 'Low Stock', cls: 'bg-warning-soft text-warning-foreground border-warning-border hover:bg-warning-soft' };
  return { label: 'In Stock', cls: 'bg-success-soft text-success-foreground border-success-border hover:bg-success-soft' };
}

function FeaturedSlide({ item }: { item: FeaturedItem }) {
  if (item.kind === 'product') {
    const img = item.image || getProductImage(item.title, item.category);
    const stock = stockTone(item.stock);
    return (
      <Link
        to={`/product/${item.id}`}
        className="block h-full rounded-2xl bg-card border border-border/60 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
      >
        <div className="aspect-[4/3] overflow-hidden bg-secondary/40">
          <img
            src={img}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] capitalize hover:bg-primary/10">
              <ShoppingCart className="h-3 w-3" /> AgroShop
            </Badge>
            <Badge variant="outline" className={`${stock.cls} text-[10px]`}>{stock.label}</Badge>
          </div>
          <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">
            {item.title}
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">৳{item.price.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
          </div>
        </div>
      </Link>
    );
  }

  const img = item.image || getCourseImage(item.title, item.category);
  return (
    <Link
      to={`/course/${item.id}`}
      className="block h-full rounded-2xl bg-card border border-border/60 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
    >
      <div className="aspect-[4/3] overflow-hidden bg-secondary/40">
        <img
          src={img}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/30 text-[10px] hover:bg-accent/15">
            <GraduationCap className="h-3 w-3" /> Masterclass
          </Badge>
          <Badge variant="outline" className={`${difficultyTone(item.difficulty)} text-[10px] capitalize`}>
            {item.difficulty}
          </Badge>
          {item.mode && (
            <Badge variant="outline" className="border-border text-muted-foreground text-[10px] capitalize">
              {item.mode}
            </Badge>
          )}
        </div>
        <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight min-h-[2.5rem]">
          {item.title}
        </h4>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{item.duration_label ?? 'Self-paced'}</span>
          <span className="text-primary font-semibold inline-flex items-center gap-1">
            Enroll <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedCarouselTile() {
  const { items, isLoading } = useFeaturedAgri();

  return (
    <Card className="col-span-1 lg:col-span-12 rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-3 flex-row items-start sm:items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Star className="h-4 w-4 fill-current" />
            </span>
            Featured this week
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 ml-9">
            Hand-picked agri-inputs &amp; masterclasses from our experts
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary shrink-0">
          <Link to="/shop">Explore all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-secondary/40 border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Featured items will appear here soon.</p>
            <Button asChild size="sm">
              <Link to="/shop">Browse the shop</Link>
            </Button>
          </div>
        ) : (
          <Carousel opts={{ align: 'start', loop: items.length > 4 }} className="px-2">
            <CarouselContent className="-ml-3">
              {items.map((item) => (
                <CarouselItem
                  key={`${item.kind}-${item.id}`}
                  className="pl-3 basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <FeaturedSlide item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-1 bg-card hover:bg-secondary text-foreground border-border" />
            <CarouselNext className="right-1 bg-card hover:bg-secondary text-foreground border-border" />
          </Carousel>
        )}
      </CardContent>
    </Card>
  );
}
