
-- New categories table
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  image_url text,
  product_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories"
  ON public.product_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories"
  ON public.product_categories FOR SELECT
  USING (is_active = true);

-- Seed existing categories
INSERT INTO public.product_categories (name, slug) VALUES
  ('Pet', 'pet'),
  ('Farm', 'farm');

-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS compare_price numeric,
  ADD COLUMN IF NOT EXISTS sku text;

-- Enable realtime for categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_categories;
