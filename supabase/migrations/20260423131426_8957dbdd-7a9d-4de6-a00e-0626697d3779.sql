-- Update create_order_with_stock to:
--   1. Accept p_division as an explicit parameter (no more comma-split fragility)
--   2. Handle 'free_delivery' coupon type symmetrically with the client
-- Also add a new validate_coupon RPC that returns only safe fields (no usage metrics).

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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_effective_delivery numeric;
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

  -- Resolve delivery charge: prefer explicit p_division, fall back to legacy
  -- comma-split for backward compatibility with older clients.
  v_division := COALESCE(NULLIF(trim(p_division), ''), trim(split_part(COALESCE(p_shipping_address, ''), ',', -1)));
  IF v_division <> '' THEN
    SELECT charge INTO v_delivery_charge
    FROM public.delivery_zones
    WHERE is_active = true AND lower(v_division) = ANY(SELECT lower(unnest(divisions)))
    LIMIT 1;
    IF v_delivery_charge IS NULL THEN
      v_delivery_charge := 120;
    END IF;
  END IF;

  v_effective_delivery := v_delivery_charge;

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
$function$;

-- Safe coupon validation RPC: returns only customer-relevant fields.
-- Hides internal metrics (used_count, usage_limit, min_order_amount) from clients.
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
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;