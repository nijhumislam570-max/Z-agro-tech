
-- Add trashed_at column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add trashed_at column to incomplete_orders table
ALTER TABLE public.incomplete_orders ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_trashed_at ON public.orders (trashed_at);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_trashed_at ON public.incomplete_orders (trashed_at);

-- Allow admins to delete orders (for permanent delete from trash)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete orders' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Admins can delete orders"
    ON public.orders
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;
