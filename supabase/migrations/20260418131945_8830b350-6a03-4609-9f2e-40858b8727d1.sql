-- Extend get_admin_dashboard_stats with completed/confirmed enrollment counts
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