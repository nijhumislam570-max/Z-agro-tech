import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CourseCategory =
  | 'plant_doctor'
  | 'plant_protection'
  | 'smart_farming'
  | 'urban_farming'
  | 'organic'
  | 'other';

export type CourseMode = 'online' | 'onsite' | 'hybrid';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  video_url: string | null;
  instructor_id: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Phase 2 fields
  category: CourseCategory;
  duration_label: string | null;
  mode: CourseMode;
  audience: string | null;
  curriculum: string[];
  whatsapp_number: string | null;
  whatsapp_message: string | null;
  provides_certificate: boolean;
  language: string;
}

function normalizeCurriculum(c: unknown): string[] {
  if (Array.isArray(c)) return c.filter((x): x is string => typeof x === 'string');
  return [];
}

function mapCourse(row: Record<string, unknown>): Course {
  return {
    ...(row as unknown as Course),
    curriculum: normalizeCurriculum((row as { curriculum?: unknown }).curriculum),
  };
}

export interface UseCoursesOpts {
  featured?: boolean;
  limit?: number;
  category?: CourseCategory | 'all';
}

export function useCourses(opts?: UseCoursesOpts) {
  return useQuery({
    queryKey: ['courses', opts],
    queryFn: async () => {
      let q = supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (opts?.category && opts.category !== 'all') q = q.eq('category', opts.category);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapCourse);
    },
  });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ['course', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapCourse(data as Record<string, unknown>) : null;
    },
  });
}

export const COURSE_CATEGORIES: Array<{ value: CourseCategory; label: string }> = [
  { value: 'plant_doctor', label: 'Plant Doctor' },
  { value: 'plant_protection', label: 'Plant Protection' },
  { value: 'smart_farming', label: 'Smart Farming' },
  { value: 'urban_farming', label: 'Urban Farming' },
  { value: 'organic', label: 'Organic' },
  { value: 'other', label: 'Other' },
];

export const COURSE_MODES: Array<{ value: CourseMode; label: string }> = [
  { value: 'online', label: 'Online' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];
