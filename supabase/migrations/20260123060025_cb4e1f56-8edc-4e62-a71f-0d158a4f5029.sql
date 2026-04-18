-- Add block fields to doctors table if not present
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS blocked_reason text;