
-- Drop the two restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create their own doctor profile" ON public.doctors;
DROP POLICY IF EXISTS "Clinic owners can create doctors for their clinic" ON public.doctors;

-- Recreate as PERMISSIVE — only ONE needs to pass
CREATE POLICY "Users can create their own doctor profile"
ON public.doctors
AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clinic owners can create doctors for their clinic"
ON public.doctors
AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (
  created_by_clinic_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = doctors.created_by_clinic_id
    AND clinics.owner_user_id = auth.uid()
  )
);
