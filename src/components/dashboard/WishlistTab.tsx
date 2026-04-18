import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { useWishlistProducts } from '@/hooks/useWishlistProducts';

const WishlistTab = () => {
  const { products, loading } = useWishlistProducts();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Heart className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-display font-semibold text-foreground">Save items you love</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Tap the heart on any product to keep it here for later.
            </p>
          </div>
          <Link to="/shop" className="inline-block">
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse the shop
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
};

export default WishlistTab;
