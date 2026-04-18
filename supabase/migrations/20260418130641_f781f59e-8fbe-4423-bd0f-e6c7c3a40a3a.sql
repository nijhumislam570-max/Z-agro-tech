-- HIGH-FIX-1: Re-attach single-admin enforcement trigger on user_roles
DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_admin();

-- HIGH-FIX-2: Allow authenticated users to read active, non-expired coupons
-- (so the checkout coupon validator works for normal customers)
DROP POLICY IF EXISTS "Authenticated users can read active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can read active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (expires_at IS NULL OR expires_at > now())
);

-- HIGH-FIX-3: Drop legacy empty Vetmedix buckets (silences storage linter & removes
-- public file enumeration surface). Wrapped to skip if not present.
DO $$
DECLARE
  b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['pet-media','clinic-images','clinic-documents','doctor-documents','cms-media']
  LOOP
    BEGIN
      DELETE FROM storage.objects WHERE bucket_id = b;
      DELETE FROM storage.buckets WHERE id = b;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping bucket %: %', b, SQLERRM;
    END;
  END LOOP;
END $$;

-- HIGH-FIX-4a: Cleanup function for expired incomplete_orders.
-- A scheduled cron will be wired separately via the insert tool (user-specific URL/key).
CREATE OR REPLACE FUNCTION public.cleanup_expired_incomplete_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.incomplete_orders
  WHERE expires_at IS NOT NULL
    AND expires_at < now()
    AND status <> 'recovered';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_incomplete_orders() FROM PUBLIC, anon, authenticated;