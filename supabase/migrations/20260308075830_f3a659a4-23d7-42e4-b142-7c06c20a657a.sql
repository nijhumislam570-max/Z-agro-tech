-- Fix notification injection vulnerability
-- Remove the pet-actor branch that allows targeting any user_id
-- Social notifications (like/comment/follow) should be moved to DB triggers
-- For now, restrict client INSERT to self-notifications only
DROP POLICY IF EXISTS "Users can create valid notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);