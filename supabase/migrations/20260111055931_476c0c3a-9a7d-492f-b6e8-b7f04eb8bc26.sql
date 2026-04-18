-- Drop the overly permissive INSERT policy for notifications
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;

-- Create a more restrictive policy - authenticated users can create notifications
CREATE POLICY "Authenticated users can create notifications" ON public.notifications 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');