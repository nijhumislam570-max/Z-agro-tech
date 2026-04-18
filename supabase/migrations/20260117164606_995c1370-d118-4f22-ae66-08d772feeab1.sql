-- Add target_clinic_id column for clinic-related notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Enable realtime for immediate notification delivery
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;