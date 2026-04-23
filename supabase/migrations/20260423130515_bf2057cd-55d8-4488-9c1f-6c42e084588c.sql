-- Aggregated view: returns the next "open" or "filling" batch per course.
-- Powers academy CourseCard without per-card useCourseBatches() calls.
CREATE OR REPLACE VIEW public.course_next_batch
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (b.course_id)
  b.course_id,
  b.id AS batch_id,
  b.name,
  b.start_date,
  b.end_date,
  b.status,
  b.total_seats,
  b.enrolled_count
FROM public.course_batches b
WHERE b.status IN ('open', 'filling')
ORDER BY b.course_id, b.start_date NULLS LAST, b.created_at;

-- Course batches are already publicly viewable; mirror that on the view.
GRANT SELECT ON public.course_next_batch TO anon, authenticated;