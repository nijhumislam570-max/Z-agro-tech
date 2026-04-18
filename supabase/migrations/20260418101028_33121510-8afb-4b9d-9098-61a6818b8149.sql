-- Phase 2: Cohort-based training courses

-- 1. Extend courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS duration_label text,
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS curriculum jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text,
  ADD COLUMN IF NOT EXISTS provides_certificate boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'bn';

-- 2. Create course_batches table
CREATE TABLE IF NOT EXISTS public.course_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  total_seats integer DEFAULT 30,
  enrolled_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_batches_course_id ON public.course_batches(course_id);
CREATE INDEX IF NOT EXISTS idx_course_batches_start_date ON public.course_batches(start_date);

ALTER TABLE public.course_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view batches"
  ON public.course_batches FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert batches"
  ON public.course_batches FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update batches"
  ON public.course_batches FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete batches"
  ON public.course_batches FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_course_batches_updated_at
  BEFORE UPDATE ON public.course_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Extend enrollments table
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.course_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 4. Allow admins to view all enrollments (for callback queue)
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
CREATE POLICY "Admins can view all enrollments"
  ON public.enrollments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update enrollments" ON public.enrollments;
CREATE POLICY "Admins can update enrollments"
  ON public.enrollments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Seed admin setting for global WhatsApp number
INSERT INTO public.admin_settings (key, value)
VALUES ('whatsapp_number', '"+8801763585500"'::jsonb)
ON CONFLICT (key) DO NOTHING;