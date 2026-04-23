import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_5MIN } from '@/lib/queryConstants';
import type { BatchStatus } from './useCourseBatches';

export interface CourseNextBatch {
  course_id: string;
  batch_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: BatchStatus;
  total_seats: number;
  enrolled_count: number;
}

/**
 * Fetches the "next" open/filling batch for a list of course IDs in a single
 * round-trip. Replaces the per-card `useCourseBatches(course.id)` N+1 pattern
 * on `/academy` and `/`.
 *
 * Backed by the `course_next_batch` Postgres view (DISTINCT ON course_id,
 * ordered by start_date NULLS LAST).
 */
export function useCoursesNextBatches(courseIds: string[] | undefined) {
  // Stable cache key independent of array order — different ordered subsets
  // of the same courses re-use the same cache entry.
  const sortedIds = [...(courseIds ?? [])].sort();

  return useQuery({
    queryKey: ['course-next-batch', sortedIds],
    enabled: sortedIds.length > 0,
    staleTime: STALE_5MIN,
    queryFn: async () => {
      // Cast through unknown — generated types haven't picked up the new view yet.
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => {
            in: (col: string, vals: string[]) => Promise<{ data: CourseNextBatch[] | null; error: Error | null }>;
          };
        };
      })
        .from('course_next_batch')
        .select('course_id,batch_id,name,start_date,end_date,status,total_seats,enrolled_count')
        .in('course_id', sortedIds);
      if (error) throw error;
      const map = new Map<string, CourseNextBatch>();
      (data ?? []).forEach((row) => map.set(row.course_id, row));
      return map;
    },
  });
}
