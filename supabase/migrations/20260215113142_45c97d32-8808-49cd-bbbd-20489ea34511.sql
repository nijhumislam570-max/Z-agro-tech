
-- Add payment gateway readiness columns
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text;
