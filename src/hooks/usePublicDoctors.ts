import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicDoctor {
  id: string;
  name: string;
  specialization: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  is_available: boolean | null;
  is_verified: boolean | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  clinic_id: string;
  clinic_name: string;
  clinic_address: string | null;
  clinic_image_url: string | null;
  clinic_is_verified: boolean;
}

export const usePublicDoctors = () => {
  return useQuery({
    queryKey: ['public-doctors'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      // Only show doctors actively affiliated with verified clinics
      const { data: clinicDoctorsData, error: cdError } = await supabase
        .from('clinic_doctors')
        .select(`
          clinic_id,
          doctor_id,
          status,
          clinic:clinics!inner(
            id,
            name,
            address,
            image_url,
            is_verified
          )
        `)
        .eq('status', 'active');

      if (cdError) throw cdError;

      // Filter to only verified clinics and collect doctor IDs
      const verifiedEntries = (clinicDoctorsData || [])
        .filter((item: any) => item.clinic?.is_verified === true);

      const verifiedDoctorIds = verifiedEntries.map((item: any) => item.doctor_id);

      if (verifiedDoctorIds.length === 0) return [];

      // Fetch only those doctors from the public view
      const { data: allDoctors, error: doctorsError } = await supabase
        .from('doctors_public')
        .select('id, name, specialization, qualifications, avatar_url, bio, experience_years, consultation_fee, is_available, is_verified, created_by_clinic_id, created_at, updated_at')
        .in('id', verifiedDoctorIds);

      if (doctorsError) throw doctorsError;

      // Build clinic lookup
      const clinicLookup = new Map<string, any>();
      verifiedEntries.forEach((item: any) => {
        clinicLookup.set(item.doctor_id, item.clinic);
      });

      // Map doctors with their clinic info
      return (allDoctors || []).map((doc: any) => {
        const clinic = clinicLookup.get(doc.id);
        return {
          id: doc.id,
          name: doc.name,
          specialization: doc.specialization,
          qualifications: doc.qualifications,
          experience_years: doc.experience_years,
          consultation_fee: doc.consultation_fee,
          is_available: doc.is_available,
          is_verified: doc.is_verified,
          avatar_url: doc.avatar_url,
          bio: doc.bio,
          created_at: doc.created_at,
          clinic_id: clinic?.id || '',
          clinic_name: clinic?.name || '',
          clinic_address: clinic?.address || null,
          clinic_image_url: clinic?.image_url || null,
          clinic_is_verified: clinic?.is_verified || false,
        } as PublicDoctor;
      });
    },
  });
};

export const usePublicDoctorById = (doctorId: string | undefined) => {
  return useQuery({
    queryKey: ['public-doctor', doctorId],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    queryFn: async () => {
      if (!doctorId) return null;

      // Get doctor basic info
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors_public')
        .select('id, name, specialization, qualifications, avatar_url, bio, experience_years, consultation_fee, is_available, is_verified, created_by_clinic_id, created_at, updated_at')
        .eq('id', doctorId)
        .single();

      if (doctorError) throw doctorError;

      // Get clinic affiliations
      const { data: affiliations, error: affError } = await supabase
        .from('clinic_doctors')
        .select(`
          clinic_id,
          status,
          clinic:clinics!inner(
            id,
            name,
            address,
            phone,
            image_url,
            is_verified,
            is_open,
            opening_hours
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      if (affError) throw affError;

      // Get schedules
      const { data: schedules, error: schedError } = await supabase
        .from('doctor_schedules')
        .select('id, doctor_id, clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, is_available, max_appointments')
        .eq('doctor_id', doctorId);

      if (schedError) throw schedError;

      return {
        ...doctor,
        affiliations: affiliations?.filter((a: any) => a.clinic?.is_verified) || [],
        schedules: schedules || [],
      };
    },
    enabled: !!doctorId,
  });
};
