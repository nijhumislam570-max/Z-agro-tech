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
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
  },
  '/admin/orders': {
    chunk: () => import('@/pages/admin/AdminOrders'),
    // Page paginates with ['admin-orders', page, pageSize] — warming chunk only is enough
  },
  '/admin/ecommerce-customers': {
    chunk: () => import('@/pages/admin/AdminEcommerceCustomers'),
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
    chunk: () => import('@/pages/admin/AdminEnrollments'),
    data: (qc) =>
      qc.prefetchQuery({
        queryKey: ['admin-enrollments'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('enrollments')
            .select('*')
            .order('enrolled_at', { ascending: false });
          if (error) throw error;
          return data ?? [];
        },
        staleTime: STALE_2MIN,
      }),
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
            .select('*')
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
