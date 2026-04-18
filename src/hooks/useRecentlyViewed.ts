import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 5;

interface RecentProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  discount?: number | null;
  badge?: string | null;
  stock?: number | null;
}

export const useRecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecentProducts(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  const addProduct = useCallback((product: RecentProduct) => {
    setRecentProducts(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentProducts, addProduct };
};
