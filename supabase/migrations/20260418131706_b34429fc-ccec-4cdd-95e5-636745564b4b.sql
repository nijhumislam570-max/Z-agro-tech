-- Block A: dedicated public bucket for course thumbnails with admin-write RLS
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Course thumbnails are publicly readable" ON storage.objects;
CREATE POLICY "Course thumbnails are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Admin-only write/update/delete
DROP POLICY IF EXISTS "Admins can upload course thumbnails" ON storage.objects;
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update course thumbnails" ON storage.objects;
CREATE POLICY "Admins can update course thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete course thumbnails" ON storage.objects;
CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));