
-- Support chat tables (separate from social messaging)
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);

-- RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users see own, admins see all
CREATE POLICY "Users can view own support conversations"
  ON public.support_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support conversations"
  ON public.support_conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own support conversations"
  ON public.support_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update support conversations"
  ON public.support_conversations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own support conversations"
  ON public.support_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: users see messages in own conversations, admins see all
CREATE POLICY "Users can view messages in own conversations"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = support_messages.conversation_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all support messages"
  ON public.support_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can send messages in own conversations"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.support_conversations
      WHERE id = support_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can send messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update support messages"
  ON public.support_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Update conversation timestamp trigger
CREATE OR REPLACE FUNCTION public.update_support_conversation_timestamp()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_support_conv_on_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_conversation_timestamp();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
