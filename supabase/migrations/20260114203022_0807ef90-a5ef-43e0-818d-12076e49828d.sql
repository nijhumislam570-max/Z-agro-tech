-- Add avatar_url to profiles table if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;