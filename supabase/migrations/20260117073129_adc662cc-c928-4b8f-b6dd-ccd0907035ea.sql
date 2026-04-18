-- Add verification fields to clinics table
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted' CHECK (verification_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS bvc_certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS trade_license_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_nid TEXT;

-- Update existing verified clinics to 'approved' status
UPDATE public.clinics 
SET verification_status = 'approved' 
WHERE is_verified = true AND verification_status IS NULL;

-- Update existing unverified clinics to 'not_submitted' status  
UPDATE public.clinics 
SET verification_status = 'not_submitted' 
WHERE is_verified = false AND verification_status IS NULL;

-- Create storage bucket for clinic verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-documents', 'clinic-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for clinic documents bucket (private - only owner and admin can access)
CREATE POLICY "Clinic owners can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clinic owners can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all clinic documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinic-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clinic owners can update their documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clinic owners can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);