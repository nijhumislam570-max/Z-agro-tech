
-- 1. Aggregated product_ratings view: replaces the N+1 review-row fetches
--    that ShopPage and ProductDetailPage do today.
CREATE OR REPLACE VIEW public.product_ratings
WITH (security_invoker = true)
AS
SELECT
  p.id AS product_id,
  COALESCE(AVG(r.rating)::numeric(10,2), 0)::numeric AS avg_rating,
  COALESCE(COUNT(r.id), 0)::int AS review_count
FROM public.products p
LEFT JOIN public.reviews r ON r.product_id = p.id
GROUP BY p.id;

-- Allow anonymous + authenticated users to read aggregated ratings.
-- Reviews table itself remains authenticated-only; this view exposes
-- only counts + averages, no PII.
GRANT SELECT ON public.product_ratings TO anon, authenticated;

-- 2. Public order tracking RPC: returns sanitized status fields keyed by
--    a known tracking_id. Customer can paste the code without logging in.
--    Exposes ONLY: id (for the realtime channel), status, tracking_id,
--    consignment_id, created_at, rejection_reason. No items/total/address.
CREATE OR REPLACE FUNCTION public.get_order_tracking_summary(p_tracking_id text)
RETURNS TABLE (
  id uuid,
  status text,
  tracking_id text,
  consignment_id text,
  rejection_reason text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking_summary(text) TO anon, authenticated;
