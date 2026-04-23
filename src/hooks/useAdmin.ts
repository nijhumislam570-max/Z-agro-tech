import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { indexBy, groupBy, uniqueKeys, joinByKey } from '@/lib/dbJoins';
import { STALE_2MIN } from '@/lib/queryConstants';
import type { AdminOrder } from '@/types/database';

interface ProfileLite {
  user_id: string;
  full_name: string | null;
  phone: string | null;
}

/** Z Agro Tech application role. */
export type AppRole = 'admin' | 'user';

export const useAdmin = () => {
  const { roles, isLoading: roleLoading, isAdmin } = useUserRole();

  return {
    userRoles: roles.map((r) => ({ role: r })),
    roleLoading,
    isAdmin,
    roles,
  };
};

export const useAdminStats = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (error) throw error;

      const stats = (data ?? {}) as Record<string, unknown>;
      const num = (k: string) => Number(stats[k]) || 0;
      const total = num('totalOrders');
      const cancelled = num('cancelledOrders');

      return {
        totalProducts: num('totalProducts'),
        activeProducts: num('activeProducts'),
        lowStockProducts: num('lowStockProducts'),
        totalOrders: total,
        activeOrders: total - cancelled,
        cancelledOrders: cancelled,
        pendingOrders: num('pendingOrders'),
        ordersToday: num('ordersToday'),
        totalUsers: num('totalUsers'),
        newUsersToday: num('newUsersToday'),
        activeRevenue: num('activeRevenue'),
        totalRevenue: num('totalRevenue'),
        revenueToday: num('revenueToday'),
        cancelledRevenue: num('totalRevenue') - num('activeRevenue'),
        totalCourses: num('totalCourses'),
        totalEnrollments: num('totalEnrollments'),
        pendingEnrollments: num('pendingEnrollments'),
        confirmedEnrollments: num('confirmedEnrollments'),
        completedEnrollments: num('completedEnrollments'),
        unreadMessages: num('unreadMessages'),
        incompleteOrders: num('incompleteOrders'),
        recentOrders: (Array.isArray(stats.recentOrders) ? stats.recentOrders : []) as Array<{
          id: string;
          total_amount: number;
          status: string | null;
          created_at: string;
        }>,
      };
    },
    enabled: isAdmin,
    staleTime: STALE_2MIN,
  });
};

/**
 * Returns ALL products for the admin catalog. The admin Products page
 * filters and searches client-side, so we keep this as a flat array.
 * For very large catalogs (>500 SKUs) consider migrating consumers to a
 * paginated variant — see useAdminOrders for the pattern.
 */
export const useAdminProducts = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
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
    enabled: isAdmin,
  });
};

export const useAdminOrders = (page = 0, pageSize = 50) => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-orders', page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: ordersData, error: ordersError, count } = await supabase
        .from('orders')
        .select('id, user_id, items, total_amount, status, shipping_address, created_at, tracking_id, payment_method, payment_status, trashed_at, consignment_id, rejection_reason', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (ordersError) throw ordersError;

      const userIds = uniqueKeys(ordersData ?? [], 'user_id');
      const { data: profilesData } = userIds.length
        ? await supabase
            .from('profiles')
            .select('user_id, full_name, phone')
            .in('user_id', userIds)
        : { data: [] as ProfileLite[] };

      const profileMap = indexBy<ProfileLite, 'user_id'>(profilesData ?? [], 'user_id');

      return {
        orders: (ordersData ?? []).map((order): AdminOrder => {
          const profile = profileMap.get(order.user_id);
          return {
            ...order,
            items: Array.isArray(order.items) ? order.items : [],
            profile: profile ? { full_name: profile.full_name, phone: profile.phone } : null,
          };
        }),
        totalCount: count || 0,
        page,
        pageSize,
      };
    },
    enabled: isAdmin,
  });
};

export const useAdminUsers = (page = 0, pageSize = 50) => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-users', page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: profiles, error, count } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, avatar_url, address, division, district, thana, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const pageUserIds = uniqueKeys(profiles ?? [], 'user_id');
      const { data: roles } = pageUserIds.length > 0
        ? await supabase.from('user_roles').select('user_id, role').in('user_id', pageUserIds)
        : { data: [] as Array<{ user_id: string; role: string }> };

      const rolesByUser = groupBy(roles ?? [], 'user_id');

      return {
        users: (profiles ?? []).map(profile => ({
          ...profile,
          user_roles: rolesByUser.get(profile.user_id) ?? [],
        })),
        totalCount: count || 0,
        page,
        pageSize,
      };
    },
    enabled: isAdmin,
  });
};
