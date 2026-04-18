
-- C1: Create atomic stock decrement function
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - p_quantity, 0),
      badge = CASE WHEN stock - p_quantity <= 0 THEN 'Stock Out' ELSE badge END
  WHERE id = p_product_id;
END;
$$;

-- C2: Add unique constraint to prevent double-booking appointments
-- Using a partial unique index to handle NULL doctor_id properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking
ON public.appointments (clinic_id, appointment_date, appointment_time, doctor_id)
WHERE status NOT IN ('cancelled', 'rejected');

-- Also handle NULL doctor_id case (appointments without a specific doctor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking_no_doctor
ON public.appointments (clinic_id, appointment_date, appointment_time)
WHERE doctor_id IS NULL AND status NOT IN ('cancelled', 'rejected');

-- M3: Create atomic coupon increment function
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
END;
$$;
