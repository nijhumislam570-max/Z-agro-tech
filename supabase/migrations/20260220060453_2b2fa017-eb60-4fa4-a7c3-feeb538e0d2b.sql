
-- Fix: Change RESTRICTIVE INSERT policies on doctors to PERMISSIVE
-- so that clinic owners OR self-registering doctors can insert.

-- Drop existing restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create their own doctor profile" ON public.doctors;
DROP POLICY IF EXISTS "Clinic owners can create doctors for their clinic" ON public.doctors;

-- Recreate as PERMISSIVE (default) so ANY matching policy allows the insert
CREATE POLICY "Users can create their own doctor profile"
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clinic owners can create doctors for their clinic"
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (
  (created_by_clinic_id IS NOT NULL)
  AND (EXISTS (
    SELECT 1 FROM clinics
    WHERE clinics.id = doctors.created_by_clinic_id
      AND clinics.owner_user_id = auth.uid()
  ))
);
