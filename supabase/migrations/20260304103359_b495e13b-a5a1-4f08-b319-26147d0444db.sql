
-- Add DELETE policy for admins on support_conversations
CREATE POLICY "Admins can delete support conversations"
  ON public.support_conversations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for admins on support_messages
CREATE POLICY "Admins can delete support messages"
  ON public.support_messages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure CASCADE on the FK so deleting a conversation removes its messages
ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_conversation_id_fkey,
  ADD CONSTRAINT support_messages_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.support_conversations(id) ON DELETE CASCADE;
