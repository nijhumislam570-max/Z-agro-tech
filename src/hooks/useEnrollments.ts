import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*), batch:course_batches(*)')
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
      if (!user) throw new Error('Sign in required');
      const { error } = await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: payload.courseId,
        batch_id: payload.batchId ?? null,
        contact_phone: payload.contactPhone ?? null,
        notes: payload.notes ?? null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: (_, payload) => {
      toast.success("Request received! We'll be in touch shortly.");
      // Invalidate both the prefix key and the user-scoped key explicitly so
      // any consumer (with or without the user id in their key) refetches.
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['enrollments', user?.id] });
      qc.invalidateQueries({ queryKey: ['enrollment', user?.id, payload.courseId] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Could not enroll'),
  });
}
