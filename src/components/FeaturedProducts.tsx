import { useEffect, memo } from 'react';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  discount: number | null;
  stock: number | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  compare_price: number | null;
}

const FeaturedProducts = memo(() => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, image_url, badge, discount, stock, is_featured, is_active, compare_price')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(8)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error('Could not load featured products. Please check your connection.');
        throw error;
      }
      return (data || []) as Product[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('featured-products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['featured-products'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  if (isLoading) {
    return (
      <section className="section-padding bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Featured Products</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background rounded-xl border border-border overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="p-3 sm:p-4 space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-5 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-9 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="section-padding bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">Could not load featured products. Please check your connection and refresh.</p>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;


  return (
    <section className="section-padding bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground">
                Featured Products
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Hand-picked by our team for your pets
              </p>
            </div>
          </div>
          <Link to="/shop">
            <Button variant="outline" size="sm" className="group rounded-xl gap-1">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
          {products.map((product) => (
            <ProductCard 
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              category={product.category}
              image={product.image_url || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=400&fit=crop'}
              badge={product.badge || undefined}
              discount={product.discount || undefined}
              stock={product.stock}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;

