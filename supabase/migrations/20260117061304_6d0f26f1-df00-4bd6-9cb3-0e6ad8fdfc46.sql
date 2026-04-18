-- Create a public view for doctors that excludes sensitive contact information
-- This allows public discoverability while protecting personal data

CREATE VIEW public.doctors_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  specialization,
  qualifications,
  experience_years,
  bio,
  avatar_url,
  consultation_fee,
  is_available,
  is_verified,
  created_by_clinic_id,
  created_at,
  updated_at
FROM public.doctors;
-- Note: email, phone, license_number, and user_id are excluded from public view

-- Drop the existing public policy that allows everyone to view all doctor data
DROP POLICY IF EXISTS "Doctors are viewable by everyone" ON public.doctors;

-- Create new restricted policies for the base doctors table:

-- 1. Authenticated users can view basic doctor info (needed for appointment booking)
CREATE POLICY "Authenticated users can view doctors"
ON public.doctors FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. Doctors can view their own full profile (already covered by existing policies)
-- The existing update/delete policies already handle ownership via user_id

-- Grant SELECT on the public view to anon and authenticated roles
GRANT SELECT ON public.doctors_public TO anon;
GRANT SELECT ON public.doctors_public TO authenticated;