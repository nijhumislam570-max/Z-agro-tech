import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_5MIN } from '@/lib/queryConstants';
import { useRecommendedProducts } from './useDashboardData';

export interface FeaturedProductItem {
  kind: 'product';
  id: string;
  title: string;
  image: string | null;
  category: string;
  price: number;
  stock: number | null;
}

export interface FeaturedCourseItem {
  kind: 'course';
  id: string;
  title: string;
  image: string | null;
  category: string | null;
  difficulty: string;
  mode: string | null;
  duration_label: string | null;
  price: number;
}

export type FeaturedItem = FeaturedProductItem | FeaturedCourseItem;

function useFeaturedCourses(limit = 3) {
  return useQuery({
    queryKey: ['featured-courses', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id,title,thumbnail_url,category,difficulty,mode,duration_label,price')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    // M4: featured lists are slow-moving; 5min stale matches recommended-products.
    staleTime: STALE_5MIN,
  });
}

export function useFeaturedAgri(): { items: FeaturedItem[]; isLoading: boolean } {
  const products = useRecommendedProducts(3);
  const courses = useFeaturedCourses(3);

  const productItems: FeaturedItem[] = (products.data ?? []).map((p) => ({
    kind: 'product' as const,
    id: p.id,
    title: p.name,
    image: p.image_url,
    category: p.category,
    price: Number(p.price),
    stock: p.stock,
  }));

  const courseItems: FeaturedItem[] = (courses.data ?? []).map((c) => ({
    kind: 'course' as const,
    id: c.id,
    title: c.title,
    image: c.thumbnail_url,
    category: c.category,
    difficulty: c.difficulty,
    mode: c.mode,
    duration_label: c.duration_label,
    price: Number(c.price),
  }));

  // interleave: product, course, product, course...
  const items: FeaturedItem[] = [];
  const max = Math.max(productItems.length, courseItems.length);
  for (let i = 0; i < max; i++) {
    if (productItems[i]) items.push(productItems[i]);
    if (courseItems[i]) items.push(courseItems[i]);
  }

  return { items, isLoading: products.isLoading || courses.isLoading };
}
