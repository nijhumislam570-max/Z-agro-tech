-- Create contact_messages table for form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit contact messages
CREATE POLICY "Anyone can submit contact messages"
ON contact_messages FOR INSERT
WITH CHECK (true);

-- Only admins can read contact messages
CREATE POLICY "Admins can manage contact messages"
ON contact_messages FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));