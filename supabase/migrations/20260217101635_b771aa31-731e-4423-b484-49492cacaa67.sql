
-- VULN-1: Atomic appointment booking function + partial unique index

-- Partial unique index to prevent double-bookings at DB level
-- Only active appointments (not cancelled/rejected) are constrained
CREATE UNIQUE INDEX idx_unique_active_appointment 
ON public.appointments (clinic_id, COALESCE(doctor_id, '00000000-0000-0000-0000-000000000000'::uuid), appointment_date, appointment_time)
WHERE status NOT IN ('cancelled', 'rejected');

-- Atomic book appointment function
CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
  p_user_id uuid,
  p_clinic_id uuid,
  p_doctor_id uuid DEFAULT NULL,
  p_appointment_date date DEFAULT NULL,
  p_appointment_time text DEFAULT NULL,
  p_pet_name text DEFAULT NULL,
  p_pet_type text DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment_id uuid;
BEGIN
  -- Verify the caller is the user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Attempt insert; the unique index will reject duplicates
  INSERT INTO public.appointments (
    user_id, clinic_id, doctor_id, appointment_date, appointment_time,
    pet_name, pet_type, reason
  ) VALUES (
    p_user_id, p_clinic_id, p_doctor_id, p_appointment_date, p_appointment_time,
    p_pet_name, p_pet_type, p_reason
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'This time slot is already booked. Please choose a different time.';
END;
$$;

-- VULN-2: Atomic order creation with stock decrement
CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_user_id uuid,
  p_items jsonb,
  p_total_amount numeric,
  p_shipping_address text DEFAULT NULL,
  p_payment_method text DEFAULT 'cod',
  p_coupon_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_current_stock int;
BEGIN
  -- Verify caller
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check stock for ALL items first (with row locks)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;  -- Row-level lock

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'name');
    END IF;
  END LOOP;

  -- Insert order
  INSERT INTO public.orders (user_id, items, total_amount, shipping_address, payment_method)
  VALUES (p_user_id, p_items, p_total_amount, p_shipping_address, p_payment_method)
  RETURNING id INTO v_order_id;

  -- Decrement stock for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    UPDATE public.products
    SET stock = GREATEST(stock - v_quantity, 0),
        badge = CASE WHEN stock - v_quantity <= 0 THEN 'Stock Out' ELSE badge END
    WHERE id = v_product_id;
  END LOOP;

  -- Increment coupon usage if applicable
  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
  END IF;

  RETURN v_order_id;
END;
$$;
