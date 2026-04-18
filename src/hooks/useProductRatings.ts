import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductRating {
  avgRating: number;
  reviewCount: number;
}

export const useProductRatings = (productIds: string[]) => {
  const [ratings, setRatings] = useState<Record<string, ProductRating>>({});

  useEffect(() => {
    if (productIds.length === 0) return;

    const fetchRatings = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('product_id, rating')
        .in('product_id', productIds);

      if (error || !data) return;

      const grouped: Record<string, number[]> = {};
      data.forEach(r => {
        if (!grouped[r.product_id]) grouped[r.product_id] = [];
        grouped[r.product_id].push(r.rating);
      });

      const result: Record<string, ProductRating> = {};
      Object.entries(grouped).forEach(([pid, ratings]) => {
        result[pid] = {
          avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          reviewCount: ratings.length,
        };
      });
      setRatings(result);
    };

    fetchRatings();
  }, [productIds.join(',')]);

  return ratings;
};
