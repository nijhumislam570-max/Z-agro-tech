
-- ============================================================
-- CMS Tables, RLS, Storage, Triggers, Realtime
-- ============================================================

-- 1. cms_categories table
CREATE TABLE public.cms_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "Anyone can view active cms categories"
  ON public.cms_categories FOR SELECT
  USING (is_active = true);

-- Admins can read all categories
CREATE POLICY "Admins can view all cms categories"
  ON public.cms_categories FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage categories
CREATE POLICY "Admins can insert cms categories"
  ON public.cms_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cms categories"
  ON public.cms_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cms categories"
  ON public.cms_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.cms_categories (name, slug, description) VALUES
  ('Health Tips', 'health-tips', 'Pet health advice and wellness tips'),
  ('Vet Care', 'vet-care', 'Veterinary care guides and information'),
  ('Announcements', 'announcements', 'Platform announcements and updates'),
  ('News', 'news', 'Pet industry news and updates');

-- 2. cms_articles table
CREATE TABLE public.cms_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Anyone can view published articles"
  ON public.cms_articles FOR SELECT
  USING (status = 'published');

-- Admins can read all articles
CREATE POLICY "Admins can view all articles"
  ON public.cms_articles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert articles
CREATE POLICY "Admins can insert articles"
  ON public.cms_articles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update articles
CREATE POLICY "Admins can update articles"
  ON public.cms_articles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete articles
CREATE POLICY "Admins can delete articles"
  ON public.cms_articles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_cms_articles_updated_at
  BEFORE UPDATE ON public.cms_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for slug lookups and status filtering
CREATE INDEX idx_cms_articles_slug ON public.cms_articles (slug);
CREATE INDEX idx_cms_articles_status ON public.cms_articles (status);
CREATE INDEX idx_cms_articles_category ON public.cms_articles (category);
CREATE INDEX idx_cms_articles_published_at ON public.cms_articles (published_at DESC);

-- 3. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_articles;

-- 4. Storage bucket for CMS media
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-media', 'cms-media', true);

-- Storage RLS: Anyone can read
CREATE POLICY "Anyone can view cms media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-media');

-- Only admins can upload
CREATE POLICY "Admins can upload cms media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cms-media' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update cms media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cms-media' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete cms media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cms-media' AND public.has_role(auth.uid(), 'admin'));

-- 5. Update get_admin_dashboard_stats to include CMS counts
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'totalProducts', (SELECT count(*) FROM products),
    'totalUsers', (SELECT count(*) FROM profiles),
    'totalClinics', (SELECT count(*) FROM clinics),
    'verifiedClinics', (SELECT count(*) FROM clinics WHERE is_verified = true),
    'totalDoctors', (SELECT count(*) FROM doctors),
    'pendingDoctors', (SELECT count(*) FROM doctors WHERE verification_status = 'pending'),
    'totalPosts', (SELECT count(*) FROM posts),
    'postsToday', (SELECT count(*) FROM posts WHERE created_at >= v_today::timestamptz),
    'totalAppointments', (SELECT count(*) FROM appointments),
    'appointmentsToday', (SELECT count(*) FROM appointments WHERE appointment_date = v_today),
    'totalOrders', (SELECT count(*) FROM orders WHERE trashed_at IS NULL),
    'pendingOrders', (SELECT count(*) FROM orders WHERE status = 'pending' AND trashed_at IS NULL),
    'cancelledOrders', (SELECT count(*) FROM orders WHERE status IN ('cancelled', 'rejected') AND trashed_at IS NULL),
    'activeRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE trashed_at IS NULL),
    'recentOrders', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM (
      SELECT id, total_amount, status, created_at
      FROM orders WHERE trashed_at IS NULL
      ORDER BY created_at DESC LIMIT 5
    ) o),
    'totalArticles', (SELECT count(*) FROM cms_articles),
    'draftArticles', (SELECT count(*) FROM cms_articles WHERE status = 'draft'),
    'publishedThisMonth', (SELECT count(*) FROM cms_articles WHERE status = 'published' AND published_at >= date_trunc('month', now()))
  ) INTO result;

  RETURN result;
END;
$function$;
