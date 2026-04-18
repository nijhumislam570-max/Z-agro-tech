-- Create doctor_schedules table for managing doctor availability
CREATE TABLE public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT true,
  max_appointments INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(doctor_id, clinic_id, day_of_week, start_time)
);

-- Add reminder tracking columns to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_type TEXT;

-- Enable RLS on doctor_schedules
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_schedules

-- Everyone can view active schedules (for booking purposes)
CREATE POLICY "Doctor schedules are viewable by everyone"
ON public.doctor_schedules
FOR SELECT
USING (true);

-- Clinic owners can insert schedules for their clinic
CREATE POLICY "Clinic owners can insert schedules"
ON public.doctor_schedules
FOR INSERT
WITH CHECK (is_clinic_owner(auth.uid(), clinic_id));

-- Clinic owners can update schedules for their clinic
CREATE POLICY "Clinic owners can update schedules"
ON public.doctor_schedules
FOR UPDATE
USING (is_clinic_owner(auth.uid(), clinic_id));

-- Clinic owners can delete schedules for their clinic
CREATE POLICY "Clinic owners can delete schedules"
ON public.doctor_schedules
FOR DELETE
USING (is_clinic_owner(auth.uid(), clinic_id));

-- Doctors can view their own schedules
CREATE POLICY "Doctors can view own schedules"
ON public.doctor_schedules
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.doctors 
  WHERE doctors.id = doctor_schedules.doctor_id 
  AND doctors.user_id = auth.uid()
));

-- Create trigger for updating updated_at
CREATE TRIGGER update_doctor_schedules_updated_at
BEFORE UPDATE ON public.doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();