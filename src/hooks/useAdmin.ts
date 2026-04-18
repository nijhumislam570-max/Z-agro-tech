import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import type { AdminOrder } from '@/types/database';

export type AppRole = 'admin' | 'user' | 'doctor' | 'clinic_owner';

export const useAdmin = () => {
  const { roles, isLoading: roleLoading, isAdmin, isClinicOwner, isDoctor } = useUserRole();

  return {
    userRoles: roles.map(r => ({ role: r })),
    roleLoading,
    isAdmin,
    isClinicOwner,
    isDoctor,
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

      const stats = data as Record<string, any>;
      const total = stats.totalOrders || 0;
      const cancelled = stats.cancelledOrders || 0;

      return {
        totalProducts: stats.totalProducts || 0,
        totalOrders: total,
        activeOrders: total - cancelled,
        cancelledOrders: cancelled,
        totalUsers: stats.totalUsers || 0,
        totalClinics: stats.totalClinics || 0,
        verifiedClinics: stats.verifiedClinics || 0,
        totalDoctors: stats.totalDoctors || 0,
        pendingDoctors: stats.pendingDoctors || 0,
        totalPosts: stats.totalPosts || 0,
        postsToday: stats.postsToday || 0,
        totalAppointments: stats.totalAppointments || 0,
        appointmentsToday: stats.appointmentsToday || 0,
        activeRevenue: Number(stats.activeRevenue) || 0,
        totalRevenue: Number(stats.totalRevenue) || 0,
        cancelledRevenue: (Number(stats.totalRevenue) || 0) - (Number(stats.activeRevenue) || 0),
        pendingOrders: stats.pendingOrders || 0,
        recentOrders: stats.recentOrders || [],
      };
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 2,
  });
};

export const useAdminProducts = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, compare_price, category, product_type, image_url, stock, badge, discount, is_active, is_featured, sku, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAdminOrders = (page = 0, pageSize = 50) => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-orders', page, pageSize],
    queryFn: async () => {
      // M-3 Fix: Use .range() for server-side pagination to avoid the 1000-row
      // Supabase default limit silently truncating results.
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: ordersData, error: ordersError, count } = await supabase
        .from('orders')
        .select('id, user_id, items, total_amount, status, shipping_address, created_at, tracking_id, payment_method, payment_status, trashed_at, consignment_id, rejection_reason', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (ordersError) throw ordersError;

      const userIds = [...new Set((ordersData || []).map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      const profileMap = new Map(
        (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, phone: p.phone }])
      );

      return {
        orders: (ordersData || []).map((order): AdminOrder => ({
          ...order,
          items: Array.isArray(order.items) ? order.items : [],
          profile: profileMap.get(order.user_id) || null,
        })),
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
      // M-3 Fix: Use .range() for server-side pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: profiles, error, count } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, avatar_url, address, division, district, thana, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Scope the roles query to only the user IDs on this page — prevents
      // fetching all rows in the table (O(N) memory leak on large platforms).
      const pageUserIds = profiles?.map(p => p.user_id) || [];
      const { data: roles } = pageUserIds.length > 0
        ? await supabase.from('user_roles').select('user_id, role').in('user_id', pageUserIds)
        : { data: [] };

      const roleMap = new Map<string, typeof roles>();
      for (const r of roles || []) {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r);
        roleMap.set(r.user_id, existing);
      }

      return {
        users: profiles?.map(profile => ({
          ...profile,
          user_roles: roleMap.get(profile.user_id) || []
        })) || [],
        totalCount: count || 0,
        page,
        pageSize,
      };
    },
    enabled: isAdmin,
  });
};

export const useAdminClinics = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, phone, email, image_url, is_verified, is_open, is_blocked, verification_status, rating, owner_user_id, owner_name, created_at, services, description, blocked_reason, rejection_reason')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAdminPosts = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          pet:pets(id, name, avatar_url, user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAdminAppointments = () => {
  const { isAdmin } = useAdmin();

  return useQuery({
    queryKey: ['admin-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(id, name),
          doctor:doctors(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};
