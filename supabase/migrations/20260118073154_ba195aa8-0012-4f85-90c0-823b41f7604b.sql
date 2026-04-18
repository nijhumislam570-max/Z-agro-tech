-- Fix: Remove overly permissive policy that allows all authenticated users to view doctors
-- This policy exposes sensitive contact information (email, phone, license_number)
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON public.doctors;

-- Note: The following policies remain intact and provide proper access:
-- 1. "Doctors can view their own full profile" - doctor can see their own data
-- 2. "Clinic owners can view their doctors" - clinic owners can see doctors they work with
-- 3. "Admins can view all doctors" - admins have full access
-- 4. Public users should use doctors_public view which excludes sensitive fields

-- The doctors_public view already exists and excludes: email, phone, license_number, user_id
-- Application code correctly uses doctors_public for public-facing features