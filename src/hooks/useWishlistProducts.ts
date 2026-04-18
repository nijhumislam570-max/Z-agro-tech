import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWishlist } from '@/contexts/WishlistContext';
import type { ShopProduct } from '@/components/shop/ProductCard';

export const useWishlistProducts = () => {
  const { wishlistIds, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ids = Array.from(wishlistIds);

    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('products')
      .select('id, name, price, compare_price, image_url, category, stock, description')
      .in('id', ids)
      .eq('is_active', true)
      .then(({ data }) => {
        if (cancelled) return;
        setProducts((data as ShopProduct[] | null) ?? []);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [wishlistIds]);

  return { products, loading: loading || wishlistLoading };
};
