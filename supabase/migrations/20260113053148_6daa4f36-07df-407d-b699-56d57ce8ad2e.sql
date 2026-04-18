-- Add RLS policies for clinic owners to view and manage appointments at their clinics

-- Policy for clinic owners to view all appointments at their clinic
CREATE POLICY "Clinic owners can view clinic appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = appointments.clinic_id
    AND clinics.owner_user_id = auth.uid()
  )
);

-- Policy for clinic owners to update appointments at their clinic (e.g., confirm/cancel)
CREATE POLICY "Clinic owners can update clinic appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = appointments.clinic_id
    AND clinics.owner_user_id = auth.uid()
  )
);

-- Policy for doctors to view appointments assigned to them
CREATE POLICY "Doctors can view their assigned appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = appointments.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

-- Policy for doctors to update their assigned appointments
CREATE POLICY "Doctors can update their assigned appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = appointments.doctor_id
    AND doctors.user_id = auth.uid()
  )
);