-- ────────────────────────────────────────────────────────────────────
-- 03 — Storage buckets + policies
-- Run AFTER 01_schema_all_migrations.sql + 02_data_inserts.sql
-- ────────────────────────────────────────────────────────────────────

-- Buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('pet-media',         'pet-media',         true),
  ('product-images',    'product-images',    true),
  ('avatars',           'avatars',           true),
  ('clinic-images',     'clinic-images',     true),
  ('clinic-documents',  'clinic-documents',  false),
  ('doctor-documents',  'doctor-documents',  false),
  ('cms-media',         'cms-media',         true),
  ('site_assets',       'site_assets',       true),
  ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Public-read for public buckets ───
CREATE POLICY "Public read: public buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN (
    'pet-media','product-images','avatars','clinic-images',
    'cms-media','site_assets','course-thumbnails'
  ));

-- ─── Authenticated users can upload to public buckets ───
CREATE POLICY "Auth users upload to public buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN (
    'pet-media','product-images','avatars','clinic-images',
    'cms-media','site_assets','course-thumbnails'
  ));

-- ─── Owners can update/delete their own objects (path = uid/...) ───
CREATE POLICY "Owners update own objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners delete own objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Private buckets: only owner can read/write ───
CREATE POLICY "Owner read private docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('clinic-documents','doctor-documents')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owner upload private docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('clinic-documents','doctor-documents')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── Admins manage all storage ───
CREATE POLICY "Admins manage all storage"
  ON storage.objects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
