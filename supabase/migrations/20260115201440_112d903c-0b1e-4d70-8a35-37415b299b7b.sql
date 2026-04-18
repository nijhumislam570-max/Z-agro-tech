-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create clinic-images bucket for clinic photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-images', 'clinic-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
-- Public can read all avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar (folder must match their user id)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for clinic-images bucket
-- Public can read all clinic images
CREATE POLICY "Clinic images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-images');

-- Clinic owners can upload images for their clinic
CREATE POLICY "Clinic owners can upload clinic images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-images' 
  AND public.is_clinic_owner(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Clinic owners can update their clinic images
CREATE POLICY "Clinic owners can update clinic images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'clinic-images' 
  AND public.is_clinic_owner(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Clinic owners can delete their clinic images
CREATE POLICY "Clinic owners can delete clinic images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinic-images' 
  AND public.is_clinic_owner(auth.uid(), (storage.foldername(name))[1]::uuid)
);