
-- Create the site_assets storage bucket for logo and favicon uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site_assets',
  'site_assets',
  true,
  5242880,
  ARRAY['image/png','image/jpeg','image/svg+xml','image/webp','image/x-icon','image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS: public read (anyone can see brand assets)
CREATE POLICY "Public can view site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site_assets');

-- RLS: only admins can upload/manage site assets
CREATE POLICY "Admins can upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site_assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update site assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site_assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete site assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site_assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );
