
-- Create a single RPC function that returns all admin dashboard stats in one call
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  -- Only allow admins
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
    ) o)
  ) INTO result;

  RETURN result;
END;
$$;
