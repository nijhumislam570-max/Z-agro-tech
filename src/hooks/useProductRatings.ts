import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_5MIN, GC_30MIN } from '@/lib/queryConstants';

export interface ProductRating {
  avgRating: number;
  reviewCount: number;
}

/**
 * Reads aggregated ratings from the `product_ratings` view (avg + count per
 * product, computed server-side). Replaces the previous N+1 raw-reviews fetch.
 *
 * The query key is the *sorted* productIds list — TanStack Query then
 * dedupes / caches across pages of infinite scroll on `/shop` instead of
 * refetching from scratch every time the visible list grows.
 */
export const useProductRatings = (productIds: string[]) => {
  // Stable, order-independent key so adding a new page of products doesn't
  // bust the cache for the previously-loaded ones.
  const sortedKey = useMemo(() => [...productIds].sort(), [productIds]);

  const { data } = useQuery({
    queryKey: ['product-ratings', sortedKey],
    enabled: sortedKey.length > 0,
    staleTime: STALE_5MIN,
    gcTime: GC_30MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_ratings' as never)
        .select('product_id, avg_rating, review_count')
        .in('product_id', sortedKey);

      if (error) throw error;
      const rows = (data ?? []) as Array<{
        product_id: string;
        avg_rating: number | string | null;
        review_count: number | null;
      }>;

      const result: Record<string, ProductRating> = {};
      for (const row of rows) {
        result[row.product_id] = {
          avgRating: Number(row.avg_rating ?? 0),
          reviewCount: Number(row.review_count ?? 0),
        };
      }
      return result;
    },
  });

  return data ?? {};
};
