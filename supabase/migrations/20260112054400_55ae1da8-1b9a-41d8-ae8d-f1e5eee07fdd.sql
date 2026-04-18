-- Drop the overly permissive notification INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a more restrictive notification INSERT policy
-- Only allow users to create notifications if they are the owner of the actor_pet
-- OR if they are creating a notification for themselves (system notifications)
CREATE POLICY "Users can create valid notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (
    -- System notifications (user creating for themselves)
    auth.uid() = user_id
    -- OR the actor_pet belongs to the authenticated user
    OR (
      actor_pet_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM public.pets 
        WHERE id = actor_pet_id 
        AND user_id = auth.uid()
      )
    )
  )
);