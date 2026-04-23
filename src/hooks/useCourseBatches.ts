import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { batchUpsertSchema, type BatchUpsertInput } from '@/lib/validations/courseActions';
import { STALE_5MIN } from '@/lib/queryConstants';

export type BatchStatus = 'open' | 'filling' | 'closed' | 'completed';

export interface CourseBatch {
  id: string;
  course_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  total_seats: number;
  enrolled_count: number;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
}

export function useCourseBatches(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-batches', courseId],
    enabled: !!courseId,
    staleTime: STALE_5MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_batches')
        .select('*')
        .eq('course_id', courseId!)
        .order('start_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as CourseBatch[];
    },
  });
}

export function useUpsertBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (raw: BatchUpsertInput) => {
      const parsed = batchUpsertSchema.parse(raw);
      const payload = {
        course_id: parsed.course_id,
        name: parsed.name,
        start_date: parsed.start_date || null,
        end_date: parsed.end_date || null,
        total_seats: parsed.total_seats,
        status: parsed.status,
      };
      if (parsed.id) {
        const { error } = await supabase
          .from('course_batches')
          .update(payload)
          .eq('id', parsed.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('course_batches').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast.success('Batch saved');
      qc.invalidateQueries({ queryKey: ['course-batches', vars.course_id] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to save batch'),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; course_id: string }) => {
      const { error } = await supabase.from('course_batches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success('Batch deleted');
      qc.invalidateQueries({ queryKey: ['course-batches', vars.course_id] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete batch'),
  });
}
