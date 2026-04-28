-- Harden broad RPC grants, tighten public-facing policies, and fix admin
-- recovery of incomplete orders without weakening customer checkout rules.

-- Narrow policies that should only ever be exercised by signed-in users.
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings"
  ON public.admin_settings
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage batches" ON public.course_batches;
CREATE POLICY "Admins manage batches"
  ON public.course_batches
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Anyone can view active courses"
  ON public.courses
  FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can manage delivery zones"
  ON public.delivery_zones
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments"
  ON public.enrollments
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.enrollments;
CREATE POLICY "Users can delete own enrollments"
  ON public.enrollments
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;
CREATE POLICY "Users can enroll themselves"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own enrollments" ON public.enrollments;
CREATE POLICY "Users can update own enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Users can view own enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid()) = user_id) OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Admins manage incomplete orders"
  ON public.incomplete_orders
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can delete own incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Users can delete own incomplete orders"
  ON public.incomplete_orders
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Users can insert own incomplete orders"
  ON public.incomplete_orders
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Users can update own incomplete orders"
  ON public.incomplete_orders
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Users can view own incomplete orders"
  ON public.incomplete_orders
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders"
  ON public.orders
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can self-assign user role" ON public.user_roles;
CREATE POLICY "Users can self-assign user role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (((SELECT auth.uid()) = user_id) AND (role = 'user'::public.app_role));

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can add to wishlist" ON public.wishlists;
CREATE POLICY "Users can add to wishlist"
  ON public.wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove from wishlist" ON public.wishlists;
CREATE POLICY "Users can remove from wishlist"
  ON public.wishlists
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist"
  ON public.wishlists
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by everyone"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

-- Keep 404 logging public, but validate the payload instead of allowing any row.
DROP POLICY IF EXISTS "Anyone can log a 404" ON public.route_404_log;
CREATE POLICY "Anyone can log a 404"
  ON public.route_404_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(path) BETWEEN 1 AND 2000
    AND left(path, 1) = '/'
    AND scope IN ('public', 'admin')
    AND char_length(COALESCE(referrer, '')) <= 500
    AND char_length(COALESCE(user_agent, '')) <= 500
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING ((bucket_id = 'avatars'::text) AND ((SELECT auth.uid())::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING ((bucket_id = 'avatars'::text) AND ((SELECT auth.uid())::text = (storage.foldername(name))[1]))
  WITH CHECK ((bucket_id = 'avatars'::text) AND ((SELECT auth.uid())::text = (storage.foldername(name))[1]));

-- Public buckets do not need broad SELECT policies on storage.objects for public URLs.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Course thumbnails are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view site assets" ON storage.objects;

-- Move low-risk read/admin RPCs to invoker mode and expose only to the roles that need them.
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'totalProducts', (SELECT count(*) FROM public.products),
    'activeProducts', (SELECT count(*) FROM public.products WHERE is_active = true),
    'lowStockProducts', (SELECT count(*) FROM public.products WHERE stock IS NOT NULL AND stock <= 5),
    'totalUsers', (SELECT count(*) FROM public.profiles),
    'newUsersToday', (SELECT count(*) FROM public.profiles WHERE created_at >= v_today::timestamptz),
    'totalOrders', (SELECT count(*) FROM public.orders WHERE trashed_at IS NULL),
    'pendingOrders', (SELECT count(*) FROM public.orders WHERE status = 'pending' AND trashed_at IS NULL),
    'cancelledOrders', (SELECT count(*) FROM public.orders WHERE status IN ('cancelled', 'rejected') AND trashed_at IS NULL),
    'ordersToday', (SELECT count(*) FROM public.orders WHERE created_at >= v_today::timestamptz AND trashed_at IS NULL),
    'activeRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE trashed_at IS NULL),
    'revenueToday', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE created_at >= v_today::timestamptz AND trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalCourses', (SELECT count(*) FROM public.courses WHERE is_active = true),
    'totalEnrollments', (SELECT count(*) FROM public.enrollments),
    'pendingEnrollments', (SELECT count(*) FROM public.enrollments WHERE status = 'pending'),
    'confirmedEnrollments', (SELECT count(*) FROM public.enrollments WHERE status = 'confirmed'),
    'completedEnrollments', (SELECT count(*) FROM public.enrollments WHERE status = 'completed'),
    'unreadMessages', (SELECT count(*) FROM public.contact_messages WHERE status = 'unread'),
    'incompleteOrders', (SELECT count(*) FROM public.incomplete_orders WHERE status = 'incomplete' AND trashed_at IS NULL),
    'recentOrders', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM (
      SELECT id, total_amount, status, created_at
      FROM public.orders WHERE trashed_at IS NULL
      ORDER BY created_at DESC LIMIT 5
    ) o)
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
RETURNS TABLE(
  id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  max_discount_amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon record;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons c
  WHERE c.code = upper(trim(p_code))
    AND c.is_active = true
  LIMIT 1;

  IF v_coupon.id IS NULL THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;
  IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
    RAISE EXCEPTION 'NOT_YET_ACTIVE';
  END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    RAISE EXCEPTION 'EXPIRED';
  END IF;
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RAISE EXCEPTION 'LIMIT_REACHED';
  END IF;
  IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    RAISE EXCEPTION 'MIN_ORDER_%', v_coupon.min_order_amount;
  END IF;

  RETURN QUERY SELECT
    v_coupon.id,
    v_coupon.code,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_coupon.max_discount_amount;
END;
$function$;

-- Admin-only recovery path for incomplete orders. This keeps checkout strict
-- for customers while letting admins recover abandoned carts safely.
CREATE OR REPLACE FUNCTION public.recover_incomplete_order(
  p_incomplete_order_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_shipping_address text,
  p_division text,
  p_payment_method text DEFAULT 'cod'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF trim(COALESCE(p_customer_name, '')) = '' OR trim(COALESCE(p_customer_phone, '')) = '' OR trim(COALESCE(p_shipping_address, '')) = '' OR trim(COALESCE(p_division, '')) = '' THEN
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
  VALUES (v_source_order.user_id, v_source_order.items, v_verified_total, v_compound_shipping_address, COALESCE(NULLIF(trim(p_payment_method), ''), 'cod'))
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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_single_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_coupon_usage(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_order_tracking_summary(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_protected_admin_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recover_incomplete_order(uuid, text, text, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock(uuid, jsonb, numeric, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_protected_admin_user_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.recover_incomplete_order(uuid, text, text, text, text, text, text) TO authenticated;

-- Cover foreign keys flagged by the performance advisor.
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses (instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch_id ON public.enrollments (batch_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists (product_id);
