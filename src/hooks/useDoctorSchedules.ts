import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DoctorSchedule {
  id: string;
  doctor_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number | null;
  is_available: boolean | null;
  max_appointments: number | null;
}

export const useDoctorSchedules = (clinicId?: string, doctorId?: string) => {
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['doctor-schedules', clinicId, doctorId],
    queryFn: async () => {
      let query = supabase
        .from('doctor_schedules')
        .select('id, doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, max_appointments')
        .eq('is_available', true);

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }
      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data, error } = await query.order('day_of_week').order('start_time');
      if (error) throw error;
      return data as DoctorSchedule[];
    },
    enabled: !!(clinicId || doctorId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const getAvailableSlotsForDate = (date: Date): string[] => {
    const dayOfWeek = date.getDay();
    const daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek && s.is_available);
    return daySchedules.map(s => s.start_time);
  };

  const hasScheduleForDay = (dayOfWeek: number): boolean => {
    return schedules.some(s => s.day_of_week === dayOfWeek && s.is_available);
  };

  return {
    schedules,
    isLoading,
    getAvailableSlotsForDate,
    hasScheduleForDay,
  };
};

export const useClinicDoctorsWithSchedules = (clinicId: string) => {
  return useQuery({
    queryKey: ['clinic-doctors-schedules', clinicId],
    queryFn: async () => {
      // Use doctors_public view for security - excludes sensitive contact info (email, phone, license)
      const { data: clinicDoctors, error: cdError } = await supabase
        .from('clinic_doctors')
        .select(`
          doctor_id,
          doctors_public (
            id,
            name,
            specialization,
            avatar_url
          )
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'active');

      if (cdError) throw cdError;

      const doctorIds = clinicDoctors?.map(cd => cd.doctor_id) || [];

      if (doctorIds.length === 0) return [];

      const { data: schedules, error: sError } = await supabase
        .from('doctor_schedules')
        .select('id, doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, max_appointments')
        .eq('clinic_id', clinicId)
        .in('doctor_id', doctorIds)
        .eq('is_available', true);

      if (sError) throw sError;

      return clinicDoctors?.map(cd => ({
        ...cd.doctors_public,
        schedules: schedules?.filter(s => s.doctor_id === cd.doctor_id) || [],
      })) || [];
    },
    enabled: !!clinicId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
