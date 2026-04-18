-- Storage policies for doctor-documents bucket (if not exists pattern using DO block)
DO $$ 
BEGIN
  -- Insert policy for doctor-documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload doctor documents') THEN
    CREATE POLICY "Authenticated users can upload doctor documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Select policy for doctor-documents  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own doctor documents') THEN
    CREATE POLICY "Users can view their own doctor documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Update policy for doctor-documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own doctor documents') THEN
    CREATE POLICY "Users can update their own doctor documents"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Delete policy for doctor-documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own doctor documents') THEN
    CREATE POLICY "Users can delete their own doctor documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Upload policy for doctor avatars
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clinic owners can upload doctor avatars') THEN
    CREATE POLICY "Clinic owners can upload doctor avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = 'doctors' AND
      auth.role() = 'authenticated'
    );
  END IF;
END $$;