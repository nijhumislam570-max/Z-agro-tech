-- Fix doctors_public view: add security_invoker=on to match other public views
CREATE OR REPLACE VIEW public.doctors_public
WITH (security_invoker=on)
AS
SELECT id,
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
   FROM doctors
  WHERE (is_blocked IS NOT TRUE);

-- Ensure proper grants
GRANT SELECT ON public.doctors_public TO anon;
GRANT SELECT ON public.doctors_public TO authenticated;