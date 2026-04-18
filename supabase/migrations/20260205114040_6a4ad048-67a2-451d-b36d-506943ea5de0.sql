
-- Drop and recreate the doctors_public view with security_invoker=off to allow public access
DROP VIEW IF EXISTS public.doctors_public;

CREATE VIEW public.doctors_public AS
SELECT 
  id,
  name,
  specialization,
  qualifications,
  experience_years,
  consultation_fee,
  is_available,
  is_verified,
  avatar_url,
  bio,
  created_at,
  updated_at,
  created_by_clinic_id
FROM public.doctors
WHERE is_blocked IS NOT TRUE;

-- Grant public select access to the view
GRANT SELECT ON public.doctors_public TO anon, authenticated;
