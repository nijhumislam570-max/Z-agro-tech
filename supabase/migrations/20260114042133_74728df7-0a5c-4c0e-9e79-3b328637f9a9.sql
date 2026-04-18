-- Make user_id nullable so clinic owners can create doctor profiles
-- without requiring the doctor to have a user account
ALTER TABLE public.doctors 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add a column to track if doctor was created by clinic vs self-registered
ALTER TABLE public.doctors 
  ADD COLUMN IF NOT EXISTS created_by_clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Update RLS policy for doctors to allow clinic owners to create doctors for their clinic
CREATE POLICY "Clinic owners can create doctors for their clinic" 
ON public.doctors 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (created_by_clinic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = created_by_clinic_id 
    AND clinics.owner_user_id = auth.uid()
  ))
);

-- Update policy for clinic owners to update doctors they created
CREATE POLICY "Clinic owners can update doctors they created" 
ON public.doctors 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (created_by_clinic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = created_by_clinic_id 
    AND clinics.owner_user_id = auth.uid()
  ))
);

-- Update policy for clinic owners to delete doctors they created
CREATE POLICY "Clinic owners can delete doctors they created" 
ON public.doctors 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (created_by_clinic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = created_by_clinic_id 
    AND clinics.owner_user_id = auth.uid()
  ))
);