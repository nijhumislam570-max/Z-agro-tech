
-- #2: Tighten contact_messages INSERT to enforce status='unread'
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (status = 'unread');

-- #6: Fix product_categories policies from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.product_categories;

CREATE POLICY "Admins can manage categories"
  ON public.product_categories
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories"
  ON public.product_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
