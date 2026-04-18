-- Add new columns to notifications table for order and appointment tracking
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_order_id UUID,
ADD COLUMN IF NOT EXISTS target_appointment_id UUID;

-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_target_order ON public.notifications(target_order_id) WHERE target_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_target_appointment ON public.notifications(target_appointment_id) WHERE target_appointment_id IS NOT NULL;