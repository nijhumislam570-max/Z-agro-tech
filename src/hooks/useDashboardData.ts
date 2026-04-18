import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyOrders } from './useMyOrders';
import { useMyEnrollments } from './useEnrollments';

export interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  stock: number | null;
}

export function useRecommendedProducts(limit = 3) {
  return useQuery({
    queryKey: ['recommended-products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,image_url,category,stock,is_featured,created_at')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as unknown as RecommendedProduct[];
    },
    staleTime: 60_000,
  });
}

export interface FeaturedMasterclass {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: string;
  duration_label: string | null;
  mode: string | null;
  category: string | null;
}

export function useFeaturedMasterclass() {
  return useQuery({
    queryKey: ['featured-masterclass'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id,title,description,thumbnail_url,difficulty,duration_label,mode,category')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as FeaturedMasterclass | null) ?? null;
    },
    staleTime: 60_000,
  });
}

/** Aggregated KPIs for the marquee. */
export function useDashboardKPIs() {
  const orders = useMyOrders();
  const enrollments = useMyEnrollments();

  const activeCourses = (enrollments.data || []).filter(
    (e) => e.status === 'confirmed' || e.status === 'pending',
  ).length;
  const lessonsInProgress = (enrollments.data || []).filter(
    (e) => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100,
  ).length;
  const recentOrdersCount = (orders.data || []).length;

  return {
    isLoading: orders.isLoading || enrollments.isLoading,
    activeCourses,
    lessonsInProgress,
    recentOrdersCount,
    latestOrder: orders.data?.[0] ?? null,
    latestEnrollment: enrollments.data?.[0] ?? null,
  };
}
