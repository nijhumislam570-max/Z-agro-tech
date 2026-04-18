-- Add admin UPDATE and DELETE policies for doctors table
CREATE POLICY "Admins can update all doctors"
ON public.doctors
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all doctors"
ON public.doctors
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));