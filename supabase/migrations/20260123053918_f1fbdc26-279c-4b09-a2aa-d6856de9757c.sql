-- Allow admins/public read for verification documents (for admin review)
-- Note: Using DO block to handle "already exists" gracefully
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view doctor documents') THEN
    CREATE POLICY "Public can view doctor documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'doctor-documents');
  END IF;
END $$;