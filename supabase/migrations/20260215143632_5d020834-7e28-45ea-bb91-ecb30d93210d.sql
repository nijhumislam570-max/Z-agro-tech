
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  charge NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT DEFAULT '3-5 days',
  is_active BOOLEAN DEFAULT true,
  divisions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage delivery zones" ON public.delivery_zones FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active delivery zones" ON public.delivery_zones FOR SELECT USING (is_active = true);

CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_zones;

-- Seed default zones
INSERT INTO public.delivery_zones (zone_name, charge, delivery_fee, estimated_days, is_active, divisions)
VALUES 
  ('Dhaka Inside', 60, 60, '1-3 days', true, ARRAY['Dhaka']),
  ('Outside Dhaka', 120, 120, '3-5 days', true, ARRAY['Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']);
