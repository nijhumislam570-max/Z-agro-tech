import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Course } from './useCourses';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number;
  course?: Course;
}

export function useMyEnrollments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['enrollments', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('user_id', user!.id)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Enrollment[];
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
        .select('id')
        .eq('user_id', user!.id)
        .eq('course_id', courseId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useEnroll() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('Sign in required');
      const { error } = await supabase
        .from('enrollments')
        .insert({ user_id: user.id, course_id: courseId });
      if (error) throw error;
    },
    onSuccess: (_, courseId) => {
      toast.success('Enrolled successfully!');
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['enrollment', user?.id, courseId] });
    },
    onError: (e: Error) => toast.error(e.message ?? 'Could not enroll'),
  });
}
