import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { EmptyState } from '@/components/ui/empty-state';
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
      <EmptyState
        icon={Heart}
        title="Save items you love"
        description="Tap the heart on any product to keep it here for later."
        action={
          <Link to="/shop">
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse the shop
            </Button>
          </Link>
        }
      />
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
