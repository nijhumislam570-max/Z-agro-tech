-- Enforce single-admin policy at the database level.
-- Only nijhumislam570@gmail.com may hold the 'admin' role.

CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.role = 'admin'::public.app_role THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
    IF v_email IS DISTINCT FROM 'nijhumislam570@gmail.com' THEN
      RAISE EXCEPTION 'Only nijhumislam570@gmail.com may hold the admin role (attempted: %)', COALESCE(v_email, '<unknown>');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_admin();