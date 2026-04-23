-- Create a lightweight log of broken routes hit by users so operators can
-- repair dead links surfaced from emails, partner sites, or stale bookmarks.
CREATE TABLE public.route_404_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  scope text NOT NULL DEFAULT 'public',
  user_id uuid,
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_404_log_created_at ON public.route_404_log (created_at DESC);
CREATE INDEX idx_route_404_log_path ON public.route_404_log (path);

ALTER TABLE public.route_404_log ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can record a 404 they encountered. Insert-only —
-- the body cannot read/update/delete to prevent abuse.
CREATE POLICY "Anyone can log a 404"
  ON public.route_404_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can review the log.
CREATE POLICY "Admins can read 404 log"
  ON public.route_404_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage 404 log"
  ON public.route_404_log
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));