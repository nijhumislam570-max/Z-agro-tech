-- ============================================
-- SECURITY FIX: Protect Sensitive Doctor & Clinic Data
-- ============================================

-- ========== FIX 1: DOCTORS TABLE ==========
-- The doctors_public view already exists and excludes sensitive fields (email, phone, license_number, user_id)
-- We need to restrict direct access to the doctors table

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Doctors are viewable by everyone" ON public.doctors;

-- Create restrictive policies for doctors table:

-- 1. Only authenticated users with legitimate roles can view full doctor details
CREATE POLICY "Doctors can view their own full profile"
ON public.doctors FOR SELECT
USING (auth.uid() = user_id);

-- 2. Clinic owners can view full details of their affiliated doctors
CREATE POLICY "Clinic owners can view their doctors"
ON public.doctors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clinic_doctors cd
    JOIN public.clinics c ON cd.clinic_id = c.id
    WHERE cd.doctor_id = doctors.id
    AND c.owner_user_id = auth.uid()
  )
);

-- 3. Admins can view all doctor details
CREATE POLICY "Admins can view all doctors"
ON public.doctors FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ========== FIX 2: CLINICS TABLE ==========
-- Create a public view that excludes sensitive verification documents

-- Drop existing view if it exists (to recreate with proper security)
DROP VIEW IF EXISTS public.clinics_public;

-- Create a public view that excludes sensitive document URLs and owner data
CREATE VIEW public.clinics_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  address,
  phone,
  email,
  description,
  image_url,
  cover_photo_url,
  opening_hours,
  services,
  rating,
  is_open,
  is_verified,
  distance,
  created_at
  -- Excludes: owner_user_id, owner_name, owner_nid, 
  -- bvc_certificate_url, trade_license_url, verification_status,
  -- verification_submitted_at, verification_reviewed_at,
  -- rejection_reason, is_blocked, blocked_at, blocked_reason
FROM public.clinics
WHERE is_blocked IS NOT TRUE;

-- Drop existing permissive policy on clinics
DROP POLICY IF EXISTS "Clinics are viewable by everyone" ON public.clinics;

-- Create restrictive policies for clinics table:

-- 1. Clinic owners can view their own full clinic details
CREATE POLICY "Clinic owners can view their own clinic"
ON public.clinics FOR SELECT
USING (owner_user_id = auth.uid());

-- 2. Admins can view all clinic details including documents
CREATE POLICY "Admins can view all clinics"
ON public.clinics FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Doctors affiliated with a clinic can view basic clinic info
CREATE POLICY "Affiliated doctors can view clinic"
ON public.clinics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clinic_doctors cd
    WHERE cd.clinic_id = clinics.id
    AND cd.doctor_id = public.get_doctor_id(auth.uid())
  )
);

-- Note: Public users should query clinics_public view instead of clinics table directly
-- The clinics_public view will inherit RLS but shows limited safe columns