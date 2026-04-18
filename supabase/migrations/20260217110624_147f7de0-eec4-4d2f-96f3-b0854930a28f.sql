
-- CRIT-1: Drop overly permissive doctor-documents upload policy
DROP POLICY IF EXISTS "Authenticated users can upload doctor documents" ON storage.objects;

-- HIGH-4: Fix avatar delete policy - replace with scoped version
DROP POLICY IF EXISTS "Authenticated users can delete doctor avatars" ON storage.objects;
CREATE POLICY "Users can delete own doctor avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'doctors'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- CRIT-2: Add DELETE policies for conversations table
CREATE POLICY "Users can delete own conversations"
ON public.conversations FOR DELETE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Admins can delete conversations"
ON public.conversations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- HIGH-1: Replace public clinic_doctors SELECT with authenticated-only policy
DROP POLICY IF EXISTS "Clinic doctors are viewable by everyone" ON public.clinic_doctors;
CREATE POLICY "Authenticated users can view clinic doctors"
ON public.clinic_doctors FOR SELECT
TO authenticated
USING (true);
