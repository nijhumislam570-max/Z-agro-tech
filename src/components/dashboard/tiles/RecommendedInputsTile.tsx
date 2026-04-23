import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useRecommendedProducts, type RecommendedProduct } from '@/hooks/useDashboardData';
import { getProductImage } from '@/lib/agriImages';

function stockBadge(stock: number | null) {
  const s = stock ?? 0;
  if (s <= 0)
    return { label: 'Out of Stock', cls: 'bg-danger-soft text-danger border-danger-border hover:bg-danger-soft' };
  if (s < 5)
    return { label: 'Low Stock', cls: 'bg-warning-soft text-warning-foreground border-warning-border hover:bg-warning-soft' };
  return { label: 'In Stock', cls: 'bg-success-soft text-success-foreground border-success-border hover:bg-success-soft' };
}

function MiniProduct({ product }: { product: RecommendedProduct }) {
  const { addItem } = useCart();
  const onAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url ?? '/placeholder.svg',
      category: product.category,
      stock: product.stock ?? undefined,
    });
    toast.success(`${product.name} added to cart`);
  };

  const img = product.image_url || getProductImage(product.name, product.category);
  const badge = stockBadge(product.stock);

  return (
    <div className="rounded-xl bg-card border border-border/60 p-3 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
      <Link to={`/product/${product.id}`} className="block aspect-square rounded-lg overflow-hidden bg-secondary/40">
        <img
          src={img}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      </Link>
      <div className="space-y-1">
        <Link to={`/product/${product.id}`} className="block">
          <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight min-h-[2rem]">
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-foreground">৳{Number(product.price).toFixed(0)}</span>
          <Badge variant="outline" className={`${badge.cls} text-[10px] px-1.5 py-0`}>{badge.label}</Badge>
        </div>
      </div>
      <Button size="sm" className="w-full h-8 text-xs" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}

export default function RecommendedInputsTile() {
  const { data, isLoading } = useRecommendedProducts(3);

  return (
    <Card className="col-span-1 lg:col-span-7 h-full flex flex-col rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sprout className="h-4 w-4" />
            </span>
            Recommended Agri-Inputs
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 ml-9">Seeds · Fertilizers · Pest Control</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary">
          <Link to="/shop">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl bg-secondary/40 border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No products available right now.</p>
            <Button asChild size="sm">
              <Link to="/shop">Browse the shop</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.map((p) => (
              <MiniProduct key={p.id} product={p} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
