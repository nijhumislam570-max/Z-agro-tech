-- =========================================================================
-- Sprint 4 — Auth + RLS hardening sweep (Z Agro Tech) — rev 2
-- (Storage bucket deletion handled separately via Supabase dashboard)
-- =========================================================================

-- 1. Drop ALL legacy storage RLS policies referencing dead buckets
DROP POLICY IF EXISTS "Anyone can view cms media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pet media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pet media" ON storage.objects;
DROP POLICY IF EXISTS "Clinic images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can upload doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can upload their documents" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctor avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view doctor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own doctor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pet media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own doctor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pet media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own doctor documents" ON storage.objects;

-- 2. Dedupe contact_messages INSERT policies
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can submit contact form" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'unread');

-- 3. Tighten storage upload policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar (scoped)"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- PRODUCT-IMAGES bucket — admin-only mutations
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- SITE_ASSETS bucket — admin-only mutations
DROP POLICY IF EXISTS "Admins can upload site assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site assets" ON storage.objects;

CREATE POLICY "Admins can upload site assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site_assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site_assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site_assets' AND public.has_role(auth.uid(), 'admin'));

-- 4. Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
