-- Fix: product_categories SELECT policy must be PERMISSIVE so non-admin users can read categories
-- Drop the existing restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.product_categories;
CREATE POLICY "Anyone can view active categories"
  ON public.product_categories
  FOR SELECT
  USING (is_active = true);

-- Also fix the admin ALL policy to be permissive
DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;
CREATE POLICY "Admins can manage categories"
  ON public.product_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));