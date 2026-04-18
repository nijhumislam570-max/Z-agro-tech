-- Fix RLS Policy: Allow public/anonymous users to view non-blocked clinics
-- This is needed because clinics_public view uses security_invoker which inherits caller's permissions

-- Add policy for anonymous users to view non-blocked clinics
CREATE POLICY "Public can view non-blocked clinics"
ON public.clinics FOR SELECT
TO anon
USING (is_blocked IS NOT TRUE);

-- Add policy for authenticated users to view non-blocked clinics (in addition to other policies)
CREATE POLICY "Authenticated users can view non-blocked clinics"
ON public.clinics FOR SELECT
TO authenticated
USING (is_blocked IS NOT TRUE);