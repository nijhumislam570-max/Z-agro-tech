import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { ProductCard, type ShopProduct } from '@/components/shop/ProductCard';
import { ProductSkeleton } from '@/components/shop/ProductSkeleton';

export const FeaturedProductsGrid = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['home-featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_price, image_url, category, stock, description')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data || []) as ShopProduct[];
    },
  });

  return (
    <section className="@container py-14 sm:py-20" aria-labelledby="featured-products">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <ShoppingBag className="h-3.5 w-3.5" /> Marketplace
            </p>
            <h2 id="featured-products" className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground">
              Featured Products
            </h2>
          </div>
          <Link to="/shop">
            <Button variant="ghost" className="gap-2 hidden sm:inline-flex">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-4 sm:gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
            : (products || []).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {!isLoading && (!products || products.length === 0) && (
          <div className="text-center py-12 bg-muted/40 rounded-2xl">
            <p className="text-muted-foreground">No products yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductsGrid;
