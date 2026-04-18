-- Add RLS policy to allow admins to update clinics
CREATE POLICY "Admins can update clinics"
ON public.clinics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));