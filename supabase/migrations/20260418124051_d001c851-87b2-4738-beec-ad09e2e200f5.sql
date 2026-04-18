-- 1. coupons: drop public read
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- 2. products: hide inactive rows from public
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by everyone"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. incomplete_orders: restrict user policies to authenticated role
DROP POLICY IF EXISTS "Users can view own incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Users can insert own incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Users can update own incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Users can delete own incomplete orders" ON public.incomplete_orders;

CREATE POLICY "Users can view own incomplete orders"
ON public.incomplete_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomplete orders"
ON public.incomplete_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomplete orders"
ON public.incomplete_orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomplete orders"
ON public.incomplete_orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);