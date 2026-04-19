-- 1) Store the protected admin's user_id in admin_settings (no hardcoded email in code)
INSERT INTO public.admin_settings (key, value)
SELECT 'protected_admin_user_id', to_jsonb(u.id::text)
FROM auth.users u
WHERE u.email = 'nijhumislam570@gmail.com'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 2) Helper RPC so the edge function (service-role) can read the protected ID
CREATE OR REPLACE FUNCTION public.get_protected_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (value #>> '{}')::uuid FROM public.admin_settings WHERE key = 'protected_admin_user_id'
$$;

-- 3) Harden create_order_with_stock: recalculate price server-side
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
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_division text;
  v_delivery_charge numeric := 120; -- fallback
  v_discount numeric := 0;
  v_coupon record;
  v_verified_total numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock products + recalc subtotal from server-side prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT stock, price INTO v_current_stock, v_unit_price
    FROM public.products
    WHERE id = v_product_id AND is_active = true
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;
    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'name');
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  -- Resolve delivery charge from shipping_address last segment (division)
  v_division := trim(split_part(COALESCE(p_shipping_address, ''), ',', -1));
  IF v_division <> '' THEN
    SELECT charge INTO v_delivery_charge
    FROM public.delivery_zones
    WHERE is_active = true AND v_division = ANY(divisions)
    LIMIT 1;
    IF v_delivery_charge IS NULL THEN
      v_delivery_charge := 120;
    END IF;
  END IF;

  -- Validate + apply coupon server-side
  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons
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
      v_discount := v_subtotal * (v_coupon.discount_value / 100);
      IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
        v_discount := v_coupon.max_discount_amount;
      END IF;
    ELSE
      v_discount := v_coupon.discount_value;
    END IF;
    v_discount := LEAST(v_discount, v_subtotal);
  END IF;

  v_verified_total := v_subtotal + v_delivery_charge - v_discount;

  -- Reject if client-supplied total deviates by more than ৳1 (rounding tolerance)
  IF abs(v_verified_total - p_total_amount) > 1 THEN
    RAISE EXCEPTION 'Order total mismatch (expected %, got %)', v_verified_total, p_total_amount;
  END IF;

  INSERT INTO public.orders (user_id, items, total_amount, shipping_address, payment_method)
  VALUES (p_user_id, p_items, v_verified_total, p_shipping_address, p_payment_method)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);
    UPDATE public.products
    SET stock = GREATEST(stock - v_quantity, 0),
        badge = CASE WHEN stock - v_quantity <= 0 THEN 'Stock Out' ELSE badge END
    WHERE id = v_product_id;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
  END IF;

  RETURN v_order_id;
END;
$$;