import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  product_count: number;
  is_active: boolean;
  created_at: string;
}

export function useProductCategories() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, slug, image_url, product_count, is_active')
        .order('name');
      if (error) throw error;
      return data as ProductCategory[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('product-categories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const addCategory = useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      const { error } = await supabase.from('product_categories').insert({ name, slug });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success('Category added');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductCategory> }) => {
      const { error } = await supabase.from('product_categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      toast.success('Category deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return { categories, isLoading, addCategory, updateCategory, deleteCategory };
}
