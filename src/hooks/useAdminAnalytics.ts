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

export interface ClinicStats {
  total: number;
  verified: number;
  pending: number;
  blocked: number;
}

export interface AppointmentStats {
  total: number;
  completed: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  price: number;
  image_url: string | null;
}

export interface VerificationFunnel {
  not_submitted: number;
  pending: number;
  approved: number;
  rejected: number;
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
  
  // Order status distribution
  orderStatusDistribution: StatusDistribution[];
  
  // Category sales
  categorySales: CategorySales[];
  
  // Top products
  topProducts: TopProduct[];
  
  // Users
  totalUsers: number;
  newUsersThisMonth: number;
  userGrowth: number;
  
  // Clinics
  clinicStats: ClinicStats;
  
  // Doctors
  totalDoctors: number;
  verifiedDoctors: number;
  
  // Appointments
  appointmentStats: AppointmentStats;
  
  // Social
  totalPosts: number;
  postsThisMonth: number;
  totalPets: number;
  
  // Products
  totalProducts: number;

  // NEW: Low stock alerts
  lowStockProducts: LowStockProduct[];

  // NEW: Unread contact messages
  unreadMessages: number;

  // NEW: Verification funnels
  clinicVerificationFunnel: VerificationFunnel;
  doctorVerificationFunnel: VerificationFunnel;

  // NEW: Fetch timestamp
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
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
        { data: clinics },
        { data: appointments },
        { count: totalPosts },
        { count: postsThisMonth },
        { count: totalPets },
        { count: totalProducts },
        { data: doctors },
        { count: unreadMessages },
        { data: lowStockProducts },
      ] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at, items'),
        supabase.from('products').select('id, name, category, image_url, price'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart.toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString()),
        supabase.from('clinics').select('id, is_verified, is_blocked, verification_status'),
        supabase.from('appointments').select('id, status'),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart.toISOString()),
        supabase.from('pets').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('id, is_verified, verification_status'),
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

      const totalRevenue = activeOrdersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const cancelledRevenue = cancelledOrdersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Monthly comparisons (always use full dataset for growth)
      const allOrdersFull = allOrders || [];
      const activeAll = allOrdersFull.filter(o => !excludedStatuses.includes(o.status || ''));
      const thisMonthActiveOrders = activeAll.filter(o => new Date(o.created_at) >= thisMonthStart);
      const lastMonthActiveOrders = activeAll.filter(o => {
        const date = new Date(o.created_at);
        return date >= lastMonthStart && date <= lastMonthEnd;
      });

      const thisMonthRevenue = thisMonthActiveOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const previousMonthRevenue = lastMonthActiveOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
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
          revenue: dayActiveOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
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
          order.items.forEach((item: any) => {
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
          order.items.forEach((item: any) => {
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

      // Clinic stats & verification funnel
      const clinicStats: ClinicStats = {
        total: clinics?.length || 0,
        verified: clinics?.filter(c => c.is_verified).length || 0,
        pending: clinics?.filter(c => c.verification_status === 'pending').length || 0,
        blocked: clinics?.filter(c => c.is_blocked).length || 0,
      };

      const clinicVerificationFunnel: VerificationFunnel = {
        not_submitted: clinics?.filter(c => c.verification_status === 'not_submitted' || !c.verification_status).length || 0,
        pending: clinics?.filter(c => c.verification_status === 'pending').length || 0,
        approved: clinics?.filter(c => c.verification_status === 'approved').length || 0,
        rejected: clinics?.filter(c => c.verification_status === 'rejected').length || 0,
      };

      // Doctor verification funnel
      const doctorVerificationFunnel: VerificationFunnel = {
        not_submitted: doctors?.filter(d => d.verification_status === 'not_submitted' || !d.verification_status).length || 0,
        pending: doctors?.filter(d => d.verification_status === 'pending').length || 0,
        approved: doctors?.filter(d => d.verification_status === 'approved' || d.is_verified).length || 0,
        rejected: doctors?.filter(d => d.verification_status === 'rejected').length || 0,
      };

      // Appointment stats
      const appointmentStats: AppointmentStats = {
        total: appointments?.length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
        confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
        pending: appointments?.filter(a => a.status === 'pending').length || 0,
        cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
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
        clinicStats,
        totalDoctors: doctors?.length || 0,
        verifiedDoctors: doctors?.filter(d => d.is_verified).length || 0,
        appointmentStats,
        totalPosts: totalPosts || 0,
        postsThisMonth: postsThisMonth || 0,
        totalPets: totalPets || 0,
        totalProducts: totalProducts || 0,
        lowStockProducts: (lowStockProducts || []).map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock ?? 0,
          price: p.price,
          image_url: p.image_url,
        })),
        unreadMessages: unreadMessages || 0,
        clinicVerificationFunnel,
        doctorVerificationFunnel,
        fetchedAt: new Date().toISOString(),
      };
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 2,
  });
};
