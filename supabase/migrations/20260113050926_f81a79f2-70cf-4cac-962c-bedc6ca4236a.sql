-- Add new roles to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'doctor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'clinic_owner';

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT,
  qualifications TEXT[],
  experience_years INTEGER,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  consultation_fee NUMERIC,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to clinics table for owner management
ALTER TABLE public.clinics 
  ADD COLUMN IF NOT EXISTS owner_user_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create clinic_doctors junction table
CREATE TABLE public.clinic_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, doctor_id)
);

-- Create clinic_services table for managing services
CREATE TABLE public.clinic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is clinic owner
CREATE OR REPLACE FUNCTION public.is_clinic_owner(_user_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinics
    WHERE id = _clinic_id
      AND owner_user_id = _user_id
  )
$$;

-- Create helper function to get user's doctor id
CREATE OR REPLACE FUNCTION public.get_doctor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE user_id = _user_id LIMIT 1
$$;

-- Doctors table policies
CREATE POLICY "Doctors are viewable by everyone" 
ON public.doctors FOR SELECT USING (true);

CREATE POLICY "Users can create their own doctor profile" 
ON public.doctors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own profile" 
ON public.doctors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can delete their own profile" 
ON public.doctors FOR DELETE 
USING (auth.uid() = user_id);

-- Clinic_doctors policies
CREATE POLICY "Clinic doctors are viewable by everyone" 
ON public.clinic_doctors FOR SELECT USING (true);

CREATE POLICY "Clinic owners can add doctors" 
ON public.clinic_doctors FOR INSERT 
WITH CHECK (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can update doctor status" 
ON public.clinic_doctors FOR UPDATE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can remove doctors" 
ON public.clinic_doctors FOR DELETE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

-- Clinic_services policies
CREATE POLICY "Clinic services are viewable by everyone" 
ON public.clinic_services FOR SELECT USING (true);

CREATE POLICY "Clinic owners can add services" 
ON public.clinic_services FOR INSERT 
WITH CHECK (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can update services" 
ON public.clinic_services FOR UPDATE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can delete services" 
ON public.clinic_services FOR DELETE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

-- Update clinics table policies for owner management
CREATE POLICY "Clinic owners can update their clinic" 
ON public.clinics FOR UPDATE 
USING (owner_user_id = auth.uid());

CREATE POLICY "Clinic owners can insert clinics" 
ON public.clinics FOR INSERT 
WITH CHECK (owner_user_id = auth.uid());

-- Update appointments table to include doctor_id
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

-- Create trigger to update doctors updated_at
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();