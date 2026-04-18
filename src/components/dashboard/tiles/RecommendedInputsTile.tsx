import { Link } from 'react-router-dom';
import { GlassCard } from '../GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sprout, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useRecommendedProducts, type RecommendedProduct } from '@/hooks/useDashboardData';

function MiniProduct({ product }: { product: RecommendedProduct }) {
  const { addItem } = useCart();
  const onAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url ?? '/placeholder.svg',
      category: product.category,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="rounded-xl bg-white/10 border border-white/15 p-3 flex flex-col gap-2 transition-all duration-200 hover:bg-white/15 hover:border-white/30">
      <Link to={`/shop/${product.id}`} className="block aspect-square rounded-lg overflow-hidden bg-white/10">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sprout className="h-8 w-8 text-white/50" />
          </div>
        )}
      </Link>
      <div className="space-y-1">
        <Link to={`/shop/${product.id}`} className="block">
          <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight min-h-[2rem]">
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-white">৳{Number(product.price).toFixed(0)}</span>
          <Badge className="bg-emerald-500/30 text-white border-emerald-300/40 text-[10px] px-1.5 py-0 hover:bg-emerald-500/30">
            In stock
          </Badge>
        </div>
      </div>
      <Button size="sm" variant="secondary" className="w-full h-8 text-xs" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}

export default function RecommendedInputsTile() {
  const { data, isLoading } = useRecommendedProducts(3);

  return (
    <GlassCard className="col-span-1 lg:col-span-7">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            Recommended Agri-Inputs
          </CardTitle>
          <p className="text-xs text-white/70 mt-1">Seeds · Fertilizers · Pest Control</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/15 hover:text-white">
          <Link to="/shop">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl bg-white/20" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl bg-white/10 border border-dashed border-white/30 p-6 text-center">
            <p className="text-sm text-white/85 mb-3">No products available right now.</p>
            <Button asChild variant="secondary" size="sm">
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
    </GlassCard>
  );
}
