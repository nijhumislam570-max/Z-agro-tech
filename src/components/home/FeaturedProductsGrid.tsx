import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { ProductCard, type ShopProduct } from '@/components/shop/ProductCard';
import { ProductSkeleton } from '@/components/shop/ProductSkeleton';
import { STALE_5MIN } from '@/lib/queryConstants';

export const FeaturedProductsGrid = () => {
  // Aligns with the `featured-products` key warmed by publicPrefetch.ts and
  // also used on /shop, so a Home → Shop → Home round-trip stays cache-hot.
  // We intentionally over-fetch (no .limit) and slice client-side: the same
  // payload powers the Shop "Featured" section, so one query feeds both pages.
  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_price, image_url, category, stock, description, is_featured, created_at')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ShopProduct[];
    },
    staleTime: STALE_5MIN,
  });

  const displayed = products?.slice(0, 6) ?? [];

  return (
    <section className="py-14 sm:py-20" aria-labelledby="featured-products">
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

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
            : displayed.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {!isLoading && displayed.length === 0 && (
          <div className="text-center py-12 bg-muted/40 rounded-2xl">
            <p className="text-muted-foreground">No featured products yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductsGrid;
