import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export interface CMSArticle {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  status: string;
  author_id: string;
  category: string;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CMSCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface ArticleFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  perPage?: number;
  adminMode?: boolean;
}

const ARTICLE_COLUMNS = 'id, title, slug, content, excerpt, featured_image, status, author_id, category, tags, published_at, created_at, updated_at';
const ARTICLE_LIST_COLUMNS = 'id, title, slug, excerpt, featured_image, status, author_id, category, tags, published_at, created_at';

export const useCMSArticles = (filters: ArticleFilters = {}) => {
  const { status, category, search, page = 1, perPage = 12, adminMode = false } = filters;

  return useQuery({
    queryKey: ['cms-articles', { status, category, search, page, perPage, adminMode }],
    queryFn: async () => {
      let query = supabase
        .from('cms_articles')
        .select(ARTICLE_LIST_COLUMNS, { count: 'exact' });

      if (!adminMode) {
        query = query.eq('status', 'published');
      } else if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (category) query = query.eq('category', category);
      if (search) query = query.ilike('title', `%${search}%`);

      query = query
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { articles: (data || []) as CMSArticle[], total: count || 0 };
    },
  });
};

export const useCMSArticle = (id: string | undefined) => {
  return useQuery({
    queryKey: ['cms-article', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_articles')
        .select(ARTICLE_COLUMNS)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as CMSArticle;
    },
    enabled: !!id,
  });
};

export const useCMSArticleBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['cms-article-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_articles')
        .select(ARTICLE_COLUMNS)
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data as CMSArticle;
    },
    enabled: !!slug,
  });
};

export const useCreateArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: Partial<CMSArticle>) => {
      const { id, created_at, updated_at, ...rest } = article;
      const payload = {
        ...rest,
        published_at: article.status === 'published' ? new Date().toISOString() : null,
      } as Database['public']['Tables']['cms_articles']['Insert'];
      const { data, error } = await supabase
        .from('cms_articles')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-articles'] });
      qc.invalidateQueries({ queryKey: ['cms-stats'] });
      toast.success('Article created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CMSArticle> & { id: string }) => {
      // Auto-set published_at when publishing
      if (updates.status === 'published' && !updates.published_at) {
        updates.published_at = new Date().toISOString();
      }
      const { created_at, updated_at, ...safeUpdates } = updates;
      const { error } = await supabase
        .from('cms_articles')
        .update(safeUpdates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cms-articles'] });
      qc.invalidateQueries({ queryKey: ['cms-article', vars.id] });
      qc.invalidateQueries({ queryKey: ['cms-stats'] });
      toast.success('Article updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteArticle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cms_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-articles'] });
      qc.invalidateQueries({ queryKey: ['cms-stats'] });
      toast.success('Article deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCMSCategories = () => {
  return useQuery({
    queryKey: ['cms-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_categories')
        .select('id, name, slug, description, is_active')
        .order('name');
      if (error) throw error;
      return (data || []) as CMSCategory[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useCMSStats = () => {
  return useQuery({
    queryKey: ['cms-stats'],
    queryFn: async () => {
      const [total, drafts, published] = await Promise.all([
        supabase.from('cms_articles').select('id', { count: 'exact', head: true }),
        supabase.from('cms_articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('cms_articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      ]);
      return {
        total: total.count || 0,
        drafts: drafts.count || 0,
        published: published.count || 0,
      };
    },
  });
};
