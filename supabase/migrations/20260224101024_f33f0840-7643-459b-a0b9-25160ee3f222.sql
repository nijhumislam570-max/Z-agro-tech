
-- P0: Fix sender_role spoofing on support_messages
-- Enforce that non-admin users MUST set sender_role = 'user'
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.support_messages;
CREATE POLICY "Users can send messages in own conversations"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_role = 'user'
    AND EXISTS (
      SELECT 1 FROM support_conversations
      WHERE id = support_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Admin policy already enforces has_role + sender_id match, but let's also enforce sender_role = 'admin'
DROP POLICY IF EXISTS "Admins can send messages" ON public.support_messages;
CREATE POLICY "Admins can send messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_role = 'admin'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- P1: Tighten contact_messages INSERT to enforce status = 'unread'
DROP POLICY IF EXISTS "Authenticated users can submit contact form" ON public.contact_messages;
CREATE POLICY "Authenticated users can submit contact form"
  ON public.contact_messages FOR INSERT
  TO authenticated
  WITH CHECK (status = 'unread');
