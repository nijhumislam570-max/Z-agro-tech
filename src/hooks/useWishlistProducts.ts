import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWishlist } from '@/contexts/WishlistContext';
import { STALE_1MIN } from '@/lib/queryConstants';
import type { ShopProduct } from '@/components/shop/ProductCard';

/**
 * React-Query backed wishlist products hook.
 * - Stable cache key (sorted IDs) so multiple consumers (WishlistTab, AlertsTile)
 *   share a single network request.
 * - Refetch on focus so admin stock/price updates surface without reload.
 */
export const useWishlistProducts = () => {
  const { wishlistIds, loading: wishlistLoading } = useWishlist();

  // Sort to keep the cache key stable regardless of insertion order.
  const sortedIds = useMemo(
    () => Array.from(wishlistIds).sort(),
    [wishlistIds],
  );

  const query = useQuery({
    queryKey: ['wishlist-products', sortedIds],
    enabled: sortedIds.length > 0,
    staleTime: STALE_1MIN,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<ShopProduct[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, compare_price, image_url, category, stock, description')
        .in('id', sortedIds)
        .eq('is_active', true);
      if (error) throw error;
      return (data as ShopProduct[] | null) ?? [];
    },
  });

  return {
    products: sortedIds.length === 0 ? [] : (query.data ?? []),
    loading: wishlistLoading || (sortedIds.length > 0 && query.isLoading),
    error: query.error,
  };
};
