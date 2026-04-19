/**
 * Admin route + data prefetcher.
 *
 * Bound to onMouseEnter / onFocus / onTouchStart on every admin nav link so
 * both (a) the route's JS chunk and (b) the destination page's primary query
 * are warmed before the user clicks. Combined with TanStack Query's
 * stale-while-revalidate cache, this makes navigation feel instant.
 *
 * Query keys/fns mirror the destination page exactly so the cache hits
 * on arrival. Failures are swallowed — prefetch is best-effort.
 */
import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type DataPrefetcher = (qc: QueryClient) => Promise<unknown>;

interface AdminPrefetchEntry {
  chunk?: () => Promise<unknown>;
  data?: DataPrefetcher;
}

const STALE_2MIN = 1000 * 60 * 2;

const ADMIN_PREFETCH: Record<string, AdminPrefetchEntry> = {
  '/admin': {
    chunk: () => import('@/pages/admin/AdminDashboard'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
          if (error) throw error;
          return data;
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/analytics': {
    chunk: () => import('@/pages/admin/AdminAnalytics'),
    // Analytics uses a date-range key — skip data prefetch (cheap to load on mount)
  },
  '/admin/products': {
    chunk: () => import('@/pages/admin/AdminProducts'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-products'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('products')
            .select(
              'id, name, description, price, compare_price, category, product_type, image_url, stock, badge, discount, is_active, is_featured, sku, created_at',
            )
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/orders': {
    chunk: () => import('@/pages/admin/AdminOrders'),
    // Warm the default page (page=0, pageSize=50) so the table paints from cache.
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-orders', 0, 50],
        queryFn: async () => {
          const { data: ordersData, error, count } = await supabase
            .from('orders')
            .select(
              'id, user_id, items, total_amount, status, shipping_address, created_at, tracking_id, payment_method, payment_status, trashed_at, consignment_id, rejection_reason',
              { count: 'exact' },
            )
            .order('created_at', { ascending: false })
            .range(0, 49);
          if (error) throw error;
          const userIds = Array.from(new Set((ordersData ?? []).map((o) => o.user_id)));
          const { data: profilesData } = userIds.length
            ? await supabase
                .from('profiles')
                .select('user_id, full_name, phone')
                .in('user_id', userIds)
            : { data: [] as Array<{ user_id: string; full_name: string | null; phone: string | null }> };
          const profileMap = new Map((profilesData ?? []).map((p) => [p.user_id, p]));
          return {
            orders: (ordersData ?? []).map((order) => {
              const profile = profileMap.get(order.user_id);
              return {
                ...order,
                items: Array.isArray(order.items) ? order.items : [],
                profile: profile ? { full_name: profile.full_name, phone: profile.phone } : null,
              };
            }),
            totalCount: count || 0,
            page: 0,
            pageSize: 50,
          };
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/ecommerce-customers': {
    chunk: () => import('@/pages/admin/AdminEcommerceCustomers'),
    data: (qc) =>
      Promise.all([
        qc.prefetchQuery({
          queryKey: ['admin-ecommerce-customers'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('orders')
              .select('user_id, total_amount, payment_status, payment_method, created_at, status')
              .order('created_at', { ascending: false })
              .limit(2000);
            if (error) throw error;
            return data ?? [];
          },
          staleTime: STALE_2MIN,
        }),
        qc.prefetchQuery({
          queryKey: ['admin-profiles-for-ecom'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('user_id, full_name, phone, avatar_url');
            if (error) throw error;
            return data ?? [];
          },
          staleTime: STALE_2MIN,
        }),
        qc.prefetchQuery({
          queryKey: ['admin-user-roles-for-ecom'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('user_roles')
              .select('user_id, role');
            if (error) throw error;
            return data ?? [];
          },
          staleTime: STALE_2MIN,
        }),
      ]),
  },
  '/admin/coupons': {
    chunk: () => import('@/pages/admin/AdminCoupons'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-coupons'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/delivery-zones': {
    chunk: () => import('@/pages/admin/AdminDeliveryZones'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-delivery-zones'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('delivery_zones')
            .select('*')
            .order('zone_name', { ascending: true });
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/incomplete-orders': {
    chunk: () => import('@/pages/admin/AdminIncompleteOrders'),
  },
  '/admin/recovery-analytics': {
    chunk: () => import('@/pages/admin/AdminRecoveryAnalytics'),
  },
  '/admin/courses': {
    chunk: () => import('@/pages/admin/AdminCourses'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-courses'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/enrollments': {
    // Page hook joins courses + batches + profiles — let it own the fetch.
    // Warming the chunk alone is enough; data prefetch here would key-collide
    // and refetch with the wrong shape.
  },
  '/admin/customers': {
    chunk: () => import('@/pages/admin/AdminCustomers'),
  },
  '/admin/messages': {
    chunk: () => import('@/pages/admin/AdminContactMessages'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-contact-messages'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('contact_messages')
            .select('id, name, email, subject, message, status, created_at')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/settings': {
    chunk: () => import('@/pages/admin/AdminSettings'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
          const { data, error } = await supabase.from('admin_settings').select('*');
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
  },
};

const prefetchedChunks = new Set<string>();
const prefetchedData = new Set<string>();

/**
 * Hover/focus/touch handler — fires once per session per path for chunks,
 * and lets TanStack Query gate data refetches via staleTime.
 */
export function prefetchAdminRoute(path: string, qc: QueryClient): void {
  const entry = ADMIN_PREFETCH[path];
  if (!entry) return;

  if (entry.chunk && !prefetchedChunks.has(path)) {
    prefetchedChunks.add(path);
    entry.chunk().catch(() => prefetchedChunks.delete(path));
  }

  if (entry.data && !prefetchedData.has(path)) {
    prefetchedData.add(path);
    entry.data(qc).catch(() => prefetchedData.delete(path));
  }
}

/**
 * Eagerly warm ALL admin route chunks during browser idle time once the
 * admin enters /admin. This makes every subsequent sidebar click an
 * instant cache hit (no network round-trip, no parse delay) — the single
 * biggest win for "feels-like-native" admin navigation.
 *
 * Chunks are loaded one-at-a-time on the idle queue so we never block the
 * main thread or the initial dashboard render. Data prefetches are skipped
 * (they're warmed individually on hover/focus to respect staleTime).
 */
let warmingStarted = false;
export function warmAllAdminChunks(): void {
  if (warmingStarted) return;
  warmingStarted = true;

  const paths = Object.keys(ADMIN_PREFETCH).filter(
    (p) => ADMIN_PREFETCH[p].chunk && !prefetchedChunks.has(p),
  );

  const ric: (cb: () => void) => void =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? (cb) => (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(cb, { timeout: 2000 })
      : (cb) => setTimeout(cb, 200) as unknown as void;

  const loadNext = (i: number) => {
    if (i >= paths.length) return;
    const path = paths[i];
    const entry = ADMIN_PREFETCH[path];
    if (entry?.chunk && !prefetchedChunks.has(path)) {
      prefetchedChunks.add(path);
      entry.chunk()
        .catch(() => prefetchedChunks.delete(path))
        .finally(() => ric(() => loadNext(i + 1)));
    } else {
      ric(() => loadNext(i + 1));
    }
  };

  ric(() => loadNext(0));
}
