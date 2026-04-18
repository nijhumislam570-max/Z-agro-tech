-- 1. CRITICAL: Fix privilege escalation - restrict self-role-insert to 'user' only
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'user'::app_role
    AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())
  );

-- 2. CRITICAL: Remove broad clinics SELECT policies that expose sensitive data
DROP POLICY IF EXISTS "Authenticated users can view non-blocked clinics" ON public.clinics;
DROP POLICY IF EXISTS "Public can view non-blocked clinics" ON public.clinics;