-- Add verification fields to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bvc_certificate_url TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS nid_number TEXT;

-- Create doctor join requests table
CREATE TABLE IF NOT EXISTS public.doctor_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  requested_by TEXT NOT NULL CHECK (requested_by IN ('doctor', 'clinic')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  UNIQUE(doctor_id, clinic_id)
);

-- Enable RLS on doctor_join_requests
ALTER TABLE public.doctor_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctor_join_requests
CREATE POLICY "Doctors can view their own requests"
ON public.doctor_join_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM doctors WHERE doctors.id = doctor_join_requests.doctor_id AND doctors.user_id = auth.uid()
));

CREATE POLICY "Doctors can create join requests"
ON public.doctor_join_requests FOR INSERT
WITH CHECK (
  requested_by = 'doctor' AND
  EXISTS (SELECT 1 FROM doctors WHERE doctors.id = doctor_join_requests.doctor_id AND doctors.user_id = auth.uid())
);

CREATE POLICY "Doctors can delete their pending requests"
ON public.doctor_join_requests FOR DELETE
USING (
  status = 'pending' AND
  EXISTS (SELECT 1 FROM doctors WHERE doctors.id = doctor_join_requests.doctor_id AND doctors.user_id = auth.uid())
);

CREATE POLICY "Clinic owners can view requests for their clinic"
ON public.doctor_join_requests FOR SELECT
USING (is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can update requests for their clinic"
ON public.doctor_join_requests FOR UPDATE
USING (is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can create invitations"
ON public.doctor_join_requests FOR INSERT
WITH CHECK (
  requested_by = 'clinic' AND
  is_clinic_owner(auth.uid(), clinic_id)
);

CREATE POLICY "Admins can view all requests"
ON public.doctor_join_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all requests"
ON public.doctor_join_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for doctor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-documents', 'doctor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for doctor-documents bucket
CREATE POLICY "Doctors can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'doctor-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all doctor documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'doctor-documents' AND
  has_role(auth.uid(), 'admin')
);

-- Update avatars bucket policy for doctor avatars
CREATE POLICY "Authenticated users can upload doctor avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Doctor avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors'
);

CREATE POLICY "Authenticated users can update doctor avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete doctor avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors' AND
  auth.role() = 'authenticated'
);

-- Create function to auto-link clinic-added doctors
CREATE OR REPLACE FUNCTION public.auto_link_clinic_doctor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by_clinic_id IS NOT NULL THEN
    INSERT INTO clinic_doctors (doctor_id, clinic_id, status)
    VALUES (NEW.id, NEW.created_by_clinic_id, 'active')
    ON CONFLICT (doctor_id, clinic_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-linking
DROP TRIGGER IF EXISTS on_doctor_created ON doctors;
CREATE TRIGGER on_doctor_created
AFTER INSERT ON doctors
FOR EACH ROW
EXECUTE FUNCTION auto_link_clinic_doctor();

-- Enable realtime for doctor_join_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_join_requests;