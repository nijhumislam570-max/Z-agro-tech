
-- SEC-2: DELETE policy for messages table (GDPR)
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- SEC-3: Restrict contact_messages INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Authenticated users can submit contact messages"
ON public.contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- SEC-4: DELETE policy for story_views (privacy)
CREATE POLICY "Users can delete their own story views"
ON public.story_views FOR DELETE
TO authenticated
USING (auth.uid() = viewer_user_id);

-- SEC-5: UPDATE/DELETE policies for reviews (user control)
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
