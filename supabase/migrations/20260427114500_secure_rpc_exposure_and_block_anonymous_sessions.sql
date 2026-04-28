-- Remove exposed SECURITY DEFINER RPCs from the public schema surface,
-- prevent anonymous-auth sessions from inheriting authenticated-table access,
-- and restore public review visibility for logged-out visitors.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.has_role_internal(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $function$
  SELECT private.has_role_internal(_user_id, _role)
$function$;

CREATE OR REPLACE FUNCTION private.create_order_with_stock_internal(
  p_user_id uuid,
  p_items jsonb,
  p_total_amount numeric,
  p_shipping_address text DEFAULT NULL::text,
  p_payment_method text DEFAULT 'cod'::text,
  p_coupon_id uuid DEFAULT NULL::uuid,
  p_division text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_current_stock integer;
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_division text;
  v_delivery_charge numeric := 120;
  v_discount numeric := 0;
  v_effective_delivery numeric;
  v_coupon record;
  v_verified_total numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT stock, price
    INTO v_current_stock, v_unit_price
    FROM public.products
    WHERE id = v_product_id
      AND is_active = true
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'name');
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  v_division := COALESCE(
    NULLIF(trim(p_division), ''),
    trim(split_part(COALESCE(p_shipping_address, ''), ',', -1))
  );

  IF v_division <> '' THEN
    SELECT charge
    INTO v_delivery_charge
    FROM public.delivery_zones
    WHERE is_active = true
      AND lower(v_division) = ANY(SELECT lower(unnest(divisions)))
    LIMIT 1;

    IF v_delivery_charge IS NULL THEN
      v_delivery_charge := 120;
    END IF;
  END IF;

  v_effective_delivery := v_delivery_charge;

  IF p_coupon_id IS NOT NULL THEN
    SELECT *
    INTO v_coupon
    FROM public.coupons
    WHERE id = p_coupon_id
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (expires_at IS NULL OR expires_at > now())
      AND (usage_limit IS NULL OR used_count < usage_limit)
      AND (min_order_amount IS NULL OR v_subtotal >= min_order_amount);

    IF v_coupon.id IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired coupon';
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100));
      IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
        v_discount := v_coupon.max_discount_amount;
      END IF;
    ELSIF v_coupon.discount_type = 'free_delivery' THEN
      v_effective_delivery := 0;
      v_discount := 0;
    ELSE
      v_discount := v_coupon.discount_value;
    END IF;

    v_discount := LEAST(v_discount, v_subtotal);
  END IF;

  v_verified_total := v_subtotal + v_effective_delivery - v_discount;

  IF abs(v_verified_total - p_total_amount) > 1 THEN
    RAISE EXCEPTION 'Order total mismatch (expected %, got %)', v_verified_total, p_total_amount;
  END IF;

  INSERT INTO public.orders (user_id, items, total_amount, shipping_address, payment_method)
  VALUES (p_user_id, p_items, v_verified_total, p_shipping_address, p_payment_method)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

    UPDATE public.products
    SET stock = GREATEST(stock - v_quantity, 0),
        badge = CASE WHEN stock - v_quantity <= 0 THEN 'Stock Out' ELSE badge END
    WHERE id = v_product_id;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = p_coupon_id;
  END IF;

  RETURN v_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_user_id uuid,
  p_items jsonb,
  p_total_amount numeric,
  p_shipping_address text DEFAULT NULL::text,
  p_payment_method text DEFAULT 'cod'::text,
  p_coupon_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $function$
  SELECT private.create_order_with_stock_internal(
    p_user_id,
    p_items,
    p_total_amount,
    p_shipping_address,
    p_payment_method,
    p_coupon_id,
    NULL::text
  )
$function$;

CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_user_id uuid,
  p_items jsonb,
  p_total_amount numeric,
  p_shipping_address text DEFAULT NULL::text,
  p_payment_method text DEFAULT 'cod'::text,
  p_coupon_id uuid DEFAULT NULL::uuid,
  p_division text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'private'
AS $function$
  SELECT private.create_order_with_stock_internal(
    p_user_id,
    p_items,
    p_total_amount,
    p_shipping_address,
    p_payment_method,
    p_coupon_id,
    p_division
  )
$function$;

CREATE OR REPLACE FUNCTION public.recover_incomplete_order(
  p_incomplete_order_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_division text,
  p_payment_method text DEFAULT 'cod'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_source_order public.incomplete_orders%ROWTYPE;
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_current_stock integer;
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_delivery_charge numeric := 120;
  v_verified_total numeric;
  v_compound_shipping_address text;
BEGIN
  IF NOT public.has_role((SELECT auth.uid()), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF trim(COALESCE(p_customer_name, '')) = ''
     OR trim(COALESCE(p_customer_phone, '')) = ''
     OR trim(COALESCE(p_shipping_address, '')) = ''
     OR trim(COALESCE(p_division, '')) = '' THEN
    RAISE EXCEPTION 'Missing required customer recovery fields';
  END IF;

  SELECT *
  INTO v_source_order
  FROM public.incomplete_orders
  WHERE id = p_incomplete_order_id
    AND trashed_at IS NULL
  FOR UPDATE;

  IF v_source_order.id IS NULL THEN
    RAISE EXCEPTION 'Incomplete order not found';
  END IF;

  IF v_source_order.status <> 'incomplete' THEN
    RAISE EXCEPTION 'Incomplete order is already recovered';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_source_order.items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT stock, price
    INTO v_current_stock, v_unit_price
    FROM public.products
    WHERE id = v_product_id
      AND is_active = true
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', COALESCE(v_item->>'name', v_product_id::text);
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  SELECT charge
  INTO v_delivery_charge
  FROM public.delivery_zones
  WHERE is_active = true
    AND lower(trim(p_division)) = ANY(SELECT lower(unnest(divisions)))
  LIMIT 1;

  v_delivery_charge := COALESCE(v_delivery_charge, 120);
  v_verified_total := v_subtotal + v_delivery_charge;
  v_compound_shipping_address := concat_ws(', ', trim(p_customer_name), trim(p_customer_phone), trim(p_shipping_address), trim(p_division));

  INSERT INTO public.orders (user_id, items, total_amount, shipping_address, payment_method)
  VALUES (
    v_source_order.user_id,
    v_source_order.items,
    v_verified_total,
    v_compound_shipping_address,
    COALESCE(NULLIF(trim(p_payment_method), ''), 'cod')
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_source_order.items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

    UPDATE public.products
    SET stock = GREATEST(stock - v_quantity, 0),
        badge = CASE WHEN stock - v_quantity <= 0 THEN 'Stock Out' ELSE badge END
    WHERE id = v_product_id;
  END LOOP;

  UPDATE public.incomplete_orders
  SET customer_name = trim(p_customer_name),
      customer_phone = trim(p_customer_phone),
      customer_email = NULLIF(trim(COALESCE(p_customer_email, '')), ''),
      shipping_address = trim(p_shipping_address),
      division = trim(p_division),
      completeness = 100,
      status = 'recovered',
      recovered_order_id = v_order_id,
      updated_at = now()
  WHERE id = p_incomplete_order_id;

  RETURN v_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_protected_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT (value #>> '{}')::uuid
  FROM public.admin_settings
  WHERE key = 'protected_admin_user_id'
$function$;

CREATE OR REPLACE FUNCTION public.get_order_tracking_summary(p_tracking_id text)
RETURNS TABLE(
  id uuid,
  status text,
  tracking_id text,
  consignment_id text,
  rejection_reason text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT
    o.id,
    o.status,
    o.tracking_id,
    o.consignment_id,
    o.rejection_reason,
    o.created_at
  FROM public.orders o
  WHERE o.tracking_id IS NOT NULL
    AND o.tracking_id = p_tracking_id
    AND o.trashed_at IS NULL
  LIMIT 1
$function$;

REVOKE EXECUTE ON FUNCTION private.has_role_internal(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.create_order_with_stock_internal(uuid, jsonb, numeric, text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role_internal(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.create_order_with_stock_internal(uuid, jsonb, numeric, text, text, uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_single_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_order_tracking_summary(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_protected_admin_user_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recover_incomplete_order(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_protected_admin_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.recover_incomplete_order(uuid, text, text, text, text, text, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can manage product categories" ON public.product_categories;
CREATE POLICY "Admins can manage product categories"
  ON public.product_categories
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage 404 log" ON public.route_404_log;
CREATE POLICY "Admins can manage 404 log"
  ON public.route_404_log
  FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can read 404 log" ON public.route_404_log;
CREATE POLICY "Admins can read 404 log"
  ON public.route_404_log
  FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.admin_settings;
CREATE POLICY "Only permanent authenticated users"
  ON public.admin_settings
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.contact_messages;
CREATE POLICY "Only permanent authenticated users"
  ON public.contact_messages
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.coupons;
CREATE POLICY "Only permanent authenticated users"
  ON public.coupons
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.course_batches;
CREATE POLICY "Only permanent authenticated users"
  ON public.course_batches
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.courses;
CREATE POLICY "Only permanent authenticated users"
  ON public.courses
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.delivery_zones;
CREATE POLICY "Only permanent authenticated users"
  ON public.delivery_zones
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.enrollments;
CREATE POLICY "Only permanent authenticated users"
  ON public.enrollments
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.incomplete_orders;
CREATE POLICY "Only permanent authenticated users"
  ON public.incomplete_orders
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.orders;
CREATE POLICY "Only permanent authenticated users"
  ON public.orders
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.product_categories;
CREATE POLICY "Only permanent authenticated users"
  ON public.product_categories
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.products;
CREATE POLICY "Only permanent authenticated users"
  ON public.products
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.profiles;
CREATE POLICY "Only permanent authenticated users"
  ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.reviews;
CREATE POLICY "Only permanent authenticated users"
  ON public.reviews
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.route_404_log;
CREATE POLICY "Only permanent authenticated users"
  ON public.route_404_log
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.user_roles;
CREATE POLICY "Only permanent authenticated users"
  ON public.user_roles
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.wishlists;
CREATE POLICY "Only permanent authenticated users"
  ON public.wishlists
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);

DROP POLICY IF EXISTS "Only permanent authenticated users" ON storage.objects;
CREATE POLICY "Only permanent authenticated users"
  ON storage.objects
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE)
  WITH CHECK ((SELECT (auth.jwt() ->> 'is_anonymous')::boolean) IS FALSE);
