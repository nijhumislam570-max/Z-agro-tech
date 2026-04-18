-- Create admin_settings table for persistent global configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can read settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert/update settings
CREATE POLICY "Admins can manage settings"
ON public.admin_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.admin_settings (key, value) VALUES
  ('store', '{"name": "VET-MEDIX", "email": "support@vetmedix.com", "currency": "BDT", "taxRate": 0}'),
  ('notifications', '{"orderAlerts": true, "lowStockAlerts": true, "newCustomerAlerts": false, "emailNotifications": true}')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();