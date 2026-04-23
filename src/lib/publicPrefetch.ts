/**
 * Public route + data prefetcher.
 *
 * Mirror of `adminPrefetch.ts` for the customer-facing site. Bound to
 * onMouseEnter / onFocus / onTouchStart on every public nav link so both
 * the route's JS chunk AND the destination page's primary query are warmed
 * before the user clicks. Combined with TanStack Query's stale-while-revalidate
 * cache, navigation feels instant.
 *
 * Query keys/fns mirror the destination page exactly so the cache hits
 * on arrival. Failures are swallowed — prefetch is best-effort.
 */
import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_1MIN, STALE_5MIN } from '@/lib/queryConstants';

type DataPrefetcher = (qc: QueryClient) => Promise<unknown>;

interface PublicPrefetchEntry {
  data?: DataPrefetcher;
}

const PUBLIC_PREFETCH: Record<string, PublicPrefetchEntry> = {
  '/shop': {
    data: (qc) =>
      Promise.all([
        // featured products list (matches ShopPage.tsx query exactly)
        qc.prefetchQuery({
          queryKey: ['featured-products'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('products')
              .select('id, name, price, category, product_type, description, image_url, images, stock, badge, discount, created_at, is_featured, is_active, compare_price, sku')
              .eq('is_active', true)
              .eq('is_featured', true)
              .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
          },
          staleTime: STALE_5MIN,
        }),
        qc.prefetchQuery({
          queryKey: ['product-categories'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('product_categories')
              .select('*')
              .eq('is_active', true);
            if (error) throw error;
            return data ?? [];
          },
          staleTime: STALE_5MIN,
        }),
      ]),
  },
  '/academy': {
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['courses', undefined],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_5MIN,
      }),
  },
  '/dashboard': {
    data: async (qc) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await Promise.all([
        qc.prefetchQuery({
          queryKey: ['my-orders', user.id],
          staleTime: STALE_1MIN,
          queryFn: async () => {
            const { data, error } = await supabase
              .from('orders')
              .select('id,status,total_amount,created_at,items,tracking_id,payment_method,shipping_address,consignment_id,rejection_reason,payment_status')
              .eq('user_id', user.id)
              .is('trashed_at', null)
              .order('created_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
          },
        }),
        qc.prefetchQuery({
          queryKey: ['enrollments', user.id],
          staleTime: STALE_1MIN,
          queryFn: async () => {
            const { data, error } = await supabase
              .from('enrollments')
              .select('*')
              .eq('user_id', user.id)
              .order('enrolled_at', { ascending: false });
            if (error) throw error;
            return data ?? [];
          },
        }),
      ]);
    },
  },
  '/checkout': {
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['delivery-zones'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('delivery_zones')
            .select('*')
            .eq('is_active', true);
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_5MIN,
      }),
  },
};

const prefetchedData = new Set<string>();

/**
 * Hover/focus/touch handler — fires once per session per path.
 * Idempotent: TanStack Query gates refetches via staleTime.
 */
export function prefetchPublicRoute(path: string, qc: QueryClient): void {
  const entry = PUBLIC_PREFETCH[path];
  if (!entry?.data) return;
  if (prefetchedData.has(path)) return;
  prefetchedData.add(path);
  entry.data(qc).catch(() => prefetchedData.delete(path));
}
