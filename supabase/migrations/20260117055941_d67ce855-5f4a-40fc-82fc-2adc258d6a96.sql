-- Add columns for Steadfast tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS consignment_id TEXT;

-- Add index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders(tracking_id);
CREATE INDEX IF NOT EXISTS idx_orders_consignment_id ON public.orders(consignment_id);