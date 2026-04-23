import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { enrollSchema } from '@/lib/validations';
import { STALE_1MIN } from '@/lib/queryConstants';
import type { Course } from './useCourses';
import type { CourseBatch } from './useCourseBatches';

export type EnrollmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number;
  batch_id: string | null;
  status: EnrollmentStatus;
  contact_phone: string | null;
  notes: string | null;
  course?: Course;
  batch?: CourseBatch | null;
}

export function useMyEnrollments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['enrollments', user?.id],
    enabled: !!user,
    staleTime: STALE_1MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          'id,user_id,course_id,enrolled_at,progress,batch_id,status,contact_phone,notes,' +
            'course:courses(id,title,thumbnail_url,category,difficulty,duration_label,mode),' +
            'batch:course_batches(id,name,start_date,end_date,status)',
        )
        .eq('user_id', user!.id)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Enrollment[];
    },
  });
}

export function useIsEnrolled(courseId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['enrollment', user?.id, courseId],
    enabled: !!user && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, status, progress')
        .eq('user_id', user!.id)
        .eq('course_id', courseId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export interface EnrollPayload {
  courseId: string;
  batchId?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
}

export function useEnroll() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EnrollPayload) => {
      // H1: Auth pre-gate — defense in depth alongside RLS.
      if (!user) throw new Error('Please sign in to enroll');

      // H3: Validate + sanitize input before sending to DB.
      const parsed = enrollSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message ?? 'Invalid enrollment data');
      }

      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: parsed.data.courseId,
        batch_id: parsed.data.batchId ?? null,
        contact_phone: parsed.data.contactPhone ?? null,
        notes: parsed.data.notes ?? null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: (_, payload) => {
      toast.success("Request received! We'll be in touch shortly.");
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['enrollments', user?.id] });
      qc.invalidateQueries({ queryKey: ['enrollment', user?.id, payload.courseId] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Could not enroll'),
  });
}
