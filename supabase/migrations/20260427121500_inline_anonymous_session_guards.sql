-- Inline anonymous-session guards into the specific policies that Supabase's
-- advisor evaluates. The earlier restrictive guard policies were sound, but
-- the advisor only considers the named policy expressions themselves.

DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.admin_settings;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.contact_messages;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.coupons;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.course_batches;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.courses;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.delivery_zones;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.enrollments;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.product_categories;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.products;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.reviews;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.route_404_log;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON public.wishlists;
DROP POLICY IF EXISTS "Only permanent authenticated users" ON storage.objects;

ALTER POLICY "Admins can manage settings"
  ON public.admin_settings
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can manage contact messages"
  ON public.contact_messages
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can manage coupons"
  ON public.coupons
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Authenticated users can read active coupons"
  ON public.coupons
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
    AND COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

ALTER POLICY "Admins manage batches"
  ON public.course_batches
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Anyone can view batches"
  ON public.course_batches
  USING (COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

ALTER POLICY "Admins manage courses"
  ON public.courses
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Anyone can view active courses"
  ON public.courses
  USING (
    is_active = true
    AND COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

ALTER POLICY "Admins can manage delivery zones"
  ON public.delivery_zones
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Anyone can view active delivery zones"
  ON public.delivery_zones
  USING (
    is_active = true
    AND COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

ALTER POLICY "Admins manage enrollments"
  ON public.enrollments
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Users can delete own enrollments"
  ON public.enrollments
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can update own enrollments"
  ON public.enrollments
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can view own enrollments"
  ON public.enrollments
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (((SELECT auth.uid()) = user_id) OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  );

ALTER POLICY "Admins manage incomplete orders"
  ON public.incomplete_orders
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Users can delete own incomplete orders"
  ON public.incomplete_orders
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can update own incomplete orders"
  ON public.incomplete_orders
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can view own incomplete orders"
  ON public.incomplete_orders
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Admins manage orders"
  ON public.orders
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Users can view their own orders"
  ON public.orders
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Admins can manage product categories"
  ON public.product_categories
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can manage products"
  ON public.products
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Users can update their own profile"
  ON public.profiles
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can view their own profile"
  ON public.profiles
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can delete their own reviews"
  ON public.reviews
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can update their own reviews"
  ON public.reviews
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Admins can manage 404 log"
  ON public.route_404_log
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can read 404 log"
  ON public.route_404_log
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can manage roles"
  ON public.user_roles
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can view all roles"
  ON public.user_roles
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Users can view own roles"
  ON public.user_roles
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can remove from wishlist"
  ON public.wishlists
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Users can view own wishlist"
  ON public.wishlists
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND (SELECT auth.uid()) = user_id
  );

ALTER POLICY "Admins can delete course thumbnails"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'course-thumbnails'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can delete product images"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'product-images'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can delete site assets"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'site_assets'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can update course thumbnails"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'course-thumbnails'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'course-thumbnails'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can update product images"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'product-images'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'product-images'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Admins can update site assets"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'site_assets'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'site_assets'
    AND public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  );

ALTER POLICY "Users can delete their own avatar"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'avatars'
    AND ((SELECT auth.uid())::text = (storage.foldername(name))[1])
  );

ALTER POLICY "Users can update their own avatar"
  ON storage.objects
  USING (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'avatars'
    AND ((SELECT auth.uid())::text = (storage.foldername(name))[1])
  )
  WITH CHECK (
    COALESCE((SELECT (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND bucket_id = 'avatars'
    AND ((SELECT auth.uid())::text = (storage.foldername(name))[1])
  );
