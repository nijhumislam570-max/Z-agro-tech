-- Speed up course batch lookups (loaded every time admin opens the Batches sheet)
CREATE INDEX IF NOT EXISTS idx_course_batches_course_start
  ON public.course_batches (course_id, start_date DESC NULLS LAST);

-- Speed up admin course listing — supports the default "newest first" ordering
CREATE INDEX IF NOT EXISTS idx_courses_active_created
  ON public.courses (is_active, created_at DESC);