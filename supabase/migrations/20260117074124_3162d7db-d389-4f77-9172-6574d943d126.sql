-- Add is_blocked column to clinics table
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Allow admins to delete clinics
CREATE POLICY "Admins can delete clinics"
ON public.clinics
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update appointments to prevent booking at blocked clinics (via application logic)