
CREATE TABLE public.incomplete_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  shipping_address text,
  division text,
  completeness integer DEFAULT 0,
  status text DEFAULT 'incomplete',
  recovered_order_id uuid,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage incomplete orders"
  ON public.incomplete_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own incomplete orders"
  ON public.incomplete_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomplete orders"
  ON public.incomplete_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own incomplete orders"
  ON public.incomplete_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomplete orders"
  ON public.incomplete_orders FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_incomplete_orders_updated_at
  BEFORE UPDATE ON public.incomplete_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.incomplete_orders;
