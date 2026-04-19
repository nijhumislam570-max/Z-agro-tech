DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);