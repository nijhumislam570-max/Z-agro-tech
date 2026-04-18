import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from './useAdmin';
import { startOfMonth, endOfMonth, subMonths, format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DateRangePreset = 'today' | '7days' | '30days' | '90days' | 'all';

export interface OrderAnalytics {
  date: string;
  orders: number;
  revenue: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface CategorySales {
  name: string;
  sales: number;
  revenue: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  revenue: number;
  image_url: string | null;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  price: number;
  image_url: string | null;
}

export interface EnrollmentStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  cancelled: number;
}

export interface AnalyticsData {
  // Revenue & Orders
  totalRevenue: number;
  cancelledRevenue: number;
  previousMonthRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  previousMonthOrders: number;
  orderGrowth: number;
  averageOrderValue: number;

  // Daily trends
  dailyTrends: OrderAnalytics[];

  // Distributions
  orderStatusDistribution: StatusDistribution[];
  categorySales: CategorySales[];
  topProducts: TopProduct[];

  // Users
  totalUsers: number;
  newUsersThisMonth: number;
  userGrowth: number;

  // Catalog
  totalProducts: number;
  lowStockProducts: LowStockProduct[];

  // Academy
  totalCourses: number;
  totalEnrollments: number;
  enrollmentStats: EnrollmentStats;

  // Inbox
  unreadMessages: number;

  fetchedAt: string;
}

function getDateRangeStart(preset: DateRangePreset): Date | null {
  const now = new Date();
  switch (preset) {
    case 'today': return startOfDay(now);
    case '7days': return startOfDay(subDays(now, 7));
    case '30days': return startOfDay(subDays(now, 30));
    case '90days': return startOfDay(subDays(now, 90));
    case 'all': return null;
  }
}

function getTrendDays(preset: DateRangePreset): number {
  switch (preset) {
    case 'today': return 1;
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    case 'all': return 14;
  }
}

export const useAdminAnalytics = (dateRange: DateRangePreset = 'all') => {
  const { isAdmin } = useAdmin();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-analytics-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  return useQuery({
    queryKey: ['admin-analytics', dateRange],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const rangeStart = getDateRangeStart(dateRange);

      const [
        { data: allOrders },
        { data: allProducts },
        { count: totalUsers },
        { count: newUsersThisMonth },
        { count: usersLastMonth },
        { count: totalProducts },
        { count: totalCourses },
        { data: enrollments },
        { count: unreadMessages },
        { data: lowStockProducts },
      ] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at, items').is('trashed_at', null),
        supabase.from('products').select('id, name, category, image_url, price'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString()),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('enrollments').select('id, status'),
        supabase.from('contact_messages').select('*', { count: 'exact', head: true })
          .eq('status', 'unread'),
        supabase.from('products').select('id, name, stock, price, image_url')
          .lte('stock', 5)
          .order('stock', { ascending: true })
          .limit(20),
      ]);

      // Filter orders by date range
      let orders = allOrders || [];
      if (rangeStart) {
        orders = orders.filter(o => new Date(o.created_at) >= rangeStart);
      }

      const excludedStatuses = ['cancelled', 'rejected'];
      const activeOrdersList = orders.filter(o => !excludedStatuses.includes(o.status || ''));
      const cancelledOrdersList = orders.filter(o => excludedStatuses.includes(o.status || ''));

      const totalRevenue = activeOrdersList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const cancelledRevenue = cancelledOrdersList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      // Monthly comparisons (always use full dataset for growth)
      const allOrdersFull = allOrders || [];
      const activeAll = allOrdersFull.filter(o => !excludedStatuses.includes(o.status || ''));
      const thisMonthActiveOrders = activeAll.filter(o => new Date(o.created_at) >= thisMonthStart);
      const lastMonthActiveOrders = activeAll.filter(o => {
        const date = new Date(o.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });

      const thisMonthRevenue = thisMonthActiveOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const previousMonthRevenue = lastMonthActiveOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      const revenueGrowth = previousMonthRevenue > 0
        ? ((thisMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : thisMonthRevenue > 0 ? 100 : 0;

      const thisMonthOrders = allOrdersFull.filter(o => new Date(o.created_at) >= thisMonthStart);
      const lastMonthOrders = allOrdersFull.filter(o => {
        const date = new Date(o.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });

      const orderGrowth = lastMonthOrders.length > 0
        ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100
        : thisMonthOrders.length > 0 ? 100 : 0;

      const userGrowth = (usersLastMonth || 0) > 0
        ? (((newUsersThisMonth || 0) - (usersLastMonth || 0)) / (usersLastMonth || 1)) * 100
        : (newUsersThisMonth || 0) > 0 ? 100 : 0;

      const averageOrderValue = activeOrdersList.length > 0 ? totalRevenue / activeOrdersList.length : 0;

      // Daily trends - adapt to date range
      const trendDays = getTrendDays(dateRange);
      const dailyTrends: OrderAnalytics[] = [];
      for (let i = trendDays - 1; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });

        const dayActiveOrders = dayOrders.filter(o => !excludedStatuses.includes(o.status || ''));

        dailyTrends.push({
          date: trendDays <= 7 ? format(date, 'EEE') : format(date, 'MMM d'),
          orders: dayOrders.length,
          revenue: dayActiveOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
        });
      }

      // Order status distribution (from filtered orders)
      const statusCounts = orders.reduce((acc, o) => {
        const status = o.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusColors: Record<string, string> = {
        pending: 'hsl(45, 93%, 47%)',
        processing: 'hsl(217, 91%, 60%)',
        shipped: 'hsl(263, 70%, 50%)',
        delivered: 'hsl(142, 71%, 45%)',
        cancelled: 'hsl(0, 84%, 60%)',
        rejected: 'hsl(0, 72%, 51%)',
      };

      const orderStatusDistribution: StatusDistribution[] = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || 'hsl(var(--muted))',
      }));

      // Category sales
      const productMap = new Map(allProducts?.map(p => [p.id, p]) || []);
      const categorySalesMap: Record<string, { sales: number; revenue: number }> = {};

      activeOrdersList.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          (order.items as any[]).forEach((item: any) => {
            const product = productMap.get(item.id);
            if (product) {
              const category = product.category || 'Other';
              if (!categorySalesMap[category]) {
                categorySalesMap[category] = { sales: 0, revenue: 0 };
              }
              categorySalesMap[category].sales += item.quantity || 1;
              categorySalesMap[category].revenue += (item.price || 0) * (item.quantity || 1);
            }
          });
        }
      });

      const categorySales: CategorySales[] = Object.entries(categorySalesMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);

      // Top products
      const productSalesMap: Record<string, { quantity: number; revenue: number }> = {};

      activeOrdersList.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          (order.items as any[]).forEach((item: any) => {
            if (!productSalesMap[item.id]) {
              productSalesMap[item.id] = { quantity: 0, revenue: 0 };
            }
            productSalesMap[item.id].quantity += item.quantity || 1;
            productSalesMap[item.id].revenue += (item.price || 0) * (item.quantity || 1);
          });
        }
      });

      const topProducts: TopProduct[] = Object.entries(productSalesMap)
        .map(([id, data]) => {
          const product = productMap.get(id);
          return {
            id,
            name: product?.name || 'Unknown Product',
            category: product?.category || 'Other',
            totalSold: data.quantity,
            revenue: data.revenue,
            image_url: product?.image_url || null,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Enrollment stats
      const enrollmentStats: EnrollmentStats = {
        total: enrollments?.length || 0,
        pending: enrollments?.filter(e => e.status === 'pending').length || 0,
        approved: enrollments?.filter(e => e.status === 'approved').length || 0,
        completed: enrollments?.filter(e => e.status === 'completed').length || 0,
        cancelled: enrollments?.filter(e => e.status === 'cancelled').length || 0,
      };

      return {
        totalRevenue,
        cancelledRevenue,
        previousMonthRevenue,
        revenueGrowth,
        totalOrders: orders.length,
        activeOrders: activeOrdersList.length,
        cancelledOrders: cancelledOrdersList.length,
        previousMonthOrders: lastMonthOrders.length,
        orderGrowth,
        averageOrderValue,
        dailyTrends,
        orderStatusDistribution,
        categorySales,
        topProducts,
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        userGrowth,
        totalProducts: totalProducts || 0,
        lowStockProducts: (lowStockProducts || []).map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock ?? 0,
          price: Number(p.price),
          image_url: p.image_url,
        })),
        totalCourses: totalCourses || 0,
        totalEnrollments: enrollments?.length || 0,
        enrollmentStats,
        unreadMessages: unreadMessages || 0,
        fetchedAt: new Date().toISOString(),
      };
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 2,
  });
};
