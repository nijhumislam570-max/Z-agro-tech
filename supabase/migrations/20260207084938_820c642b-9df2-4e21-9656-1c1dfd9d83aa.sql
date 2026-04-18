-- Admin needs to view ALL profiles for analytics & user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin needs to view ALL appointments for analytics
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin needs to update appointments (e.g. manage status)
CREATE POLICY "Admins can update all appointments"
ON public.appointments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));