-- ═══════════════════════════════════════════════════════════════
-- Z AGRO TECH — LEGACY VET-MEDIX DEMOLITION (v3)
-- ═══════════════════════════════════════════════════════════════

-- 1. DROP DEPENDENT VIEWS
DROP VIEW IF EXISTS public.clinics_public CASCADE;
DROP VIEW IF EXISTS public.doctors_public CASCADE;

-- 2. DROP LEGACY FUNCTIONS
DROP FUNCTION IF EXISTS public.notify_on_new_appointment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_waitlist_on_cancellation() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_waitlist_position() CASCADE;
DROP FUNCTION IF EXISTS public.book_appointment_atomic(uuid, uuid, uuid, date, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.is_clinic_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_doctor_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_clinic_rating() CASCADE;
DROP FUNCTION IF EXISTS public.auto_link_clinic_doctor() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_comment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_like() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_follow() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.increment_story_views() CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_support_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.check_pet_limit() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_on_new_order() CASCADE;
DROP FUNCTION IF EXISTS public.notify_user_on_order_update() CASCADE;

-- 3. DROP LEGACY TABLES
DROP TABLE IF EXISTS public.appointment_waitlist CASCADE;
DROP TABLE IF EXISTS public.doctor_join_requests CASCADE;
DROP TABLE IF EXISTS public.doctor_schedules CASCADE;
DROP TABLE IF EXISTS public.doctor_favorites CASCADE;
DROP TABLE IF EXISTS public.clinic_doctors CASCADE;
DROP TABLE IF EXISTS public.clinic_services CASCADE;
DROP TABLE IF EXISTS public.clinic_reviews CASCADE;
DROP TABLE IF EXISTS public.clinic_favorites CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.pets CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.support_conversations CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.cms_articles CASCADE;
DROP TABLE IF EXISTS public.cms_categories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 4. SWAP app_role enum — drop dependent policies/functions first
DO $$
DECLARE pol_name text;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol_name);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
UPDATE public.user_roles SET role = 'user' WHERE role NOT IN ('admin', 'user');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- 5. RECREATE has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. RECREATE user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can self-assign user role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'user');

-- 7. RECREATE policies on tables that depended on the old has_role
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can read settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can manage delivery zones" ON public.delivery_zones
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active courses" ON public.courses
  FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete batches" ON public.course_batches;
DROP POLICY IF EXISTS "Admins can insert batches" ON public.course_batches;
DROP POLICY IF EXISTS "Admins can update batches" ON public.course_batches;
CREATE POLICY "Admins manage batches" ON public.course_batches
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments" ON public.enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Admins manage incomplete orders" ON public.incomplete_orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. REWRITE get_admin_dashboard_stats for Z Agro Tech only
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
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
$$;