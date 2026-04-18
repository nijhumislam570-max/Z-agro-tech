import { Link } from 'react-router-dom';
import { GlassCard } from '../GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  if (l.includes('begin')) return 'bg-success/90 text-white border-transparent hover:bg-success/90';
  if (l.includes('inter')) return 'bg-warning/90 text-white border-transparent hover:bg-warning/90';
  if (l.includes('adv')) return 'bg-danger/90 text-white border-transparent hover:bg-danger/90';
  return 'bg-white/90 text-foreground hover:bg-white/90 border-transparent';
}

function stockTone(stock: number | null) {
  const s = stock ?? 0;
  if (s <= 0) return { label: 'Out of Stock', cls: 'bg-danger/90 text-white border-transparent hover:bg-danger/90' };
  if (s < 5) return { label: 'Low Stock', cls: 'bg-warning/90 text-white border-transparent hover:bg-warning/90' };
  return { label: 'In Stock', cls: 'bg-success/90 text-white border-transparent hover:bg-success/90' };
}

function FeaturedSlide({ item }: { item: FeaturedItem }) {
  if (item.kind === 'product') {
    const img = item.image || getProductImage(item.title, item.category);
    const stock = stockTone(item.stock);
    return (
      <Link
        to={`/product/${item.id}`}
        className="block h-full rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-white/15"
      >
        <div className="aspect-[4/3] overflow-hidden bg-white/5">
          <img
            src={img}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="bg-white/90 text-foreground text-[10px] capitalize hover:bg-white/90 border-transparent">
              <ShoppingCart className="h-3 w-3" /> AgroShop
            </Badge>
            <Badge className={`${stock.cls} text-[10px]`}>{stock.label}</Badge>
          </div>
          <h4 className="text-sm font-semibold text-white line-clamp-2 leading-tight min-h-[2.5rem]">
            {item.title}
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">৳{item.price.toFixed(0)}</span>
            <span className="text-xs text-white/70 capitalize">{item.category}</span>
          </div>
        </div>
      </Link>
    );
  }

  const img = item.image || getCourseImage(item.title, item.category);
  return (
    <Link
      to={`/course/${item.id}`}
      className="block h-full rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:bg-white/15"
    >
      <div className="aspect-[4/3] overflow-hidden bg-white/5">
        <img
          src={img}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className="bg-white/90 text-foreground text-[10px] hover:bg-white/90 border-transparent">
            <GraduationCap className="h-3 w-3" /> Masterclass
          </Badge>
          <Badge className={`${difficultyTone(item.difficulty)} text-[10px] capitalize`}>
            {item.difficulty}
          </Badge>
          {item.mode && (
            <Badge variant="outline" className="border-white/40 text-white text-[10px] capitalize">
              {item.mode}
            </Badge>
          )}
        </div>
        <h4 className="text-sm font-semibold text-white line-clamp-2 leading-tight min-h-[2.5rem]">
          {item.title}
        </h4>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/80">{item.duration_label ?? 'Self-paced'}</span>
          <span className="text-white font-semibold inline-flex items-center gap-1">
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
    <GlassCard className="col-span-1 lg:col-span-12 overflow-hidden">
      <CardHeader className="pb-3 flex-row items-start sm:items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Star className="h-4 w-4 fill-current" />
            Featured this week
          </CardTitle>
          <p className="text-xs text-white/75 mt-1">
            Hand-picked agri-inputs &amp; masterclasses from our experts
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/15 hover:text-white shrink-0">
          <Link to="/shop">Explore all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl bg-white/20" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white/10 border border-dashed border-white/30 p-6 text-center">
            <p className="text-sm text-white/85 mb-3">Featured items will appear here soon.</p>
            <Button asChild variant="secondary" size="sm">
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
            <CarouselPrevious className="left-1 bg-white/90 hover:bg-white text-foreground border-transparent" />
            <CarouselNext className="right-1 bg-white/90 hover:bg-white text-foreground border-transparent" />
          </Carousel>
        )}
      </CardContent>
    </GlassCard>
  );
}
