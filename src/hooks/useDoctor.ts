import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialization: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  consultation_fee: number | null;
  is_available: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicDoctor {
  id: string;
  clinic_id: string;
  doctor_id: string;
  status: string;
  joined_at: string;
  doctor?: Doctor;
  clinic?: {
    id: string;
    name: string;
    address: string | null;
    image_url: string | null;
  };
}

export const useDoctor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: doctorProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('doctors')
        .select('id, user_id, name, specialization, qualifications, bio, avatar_url, phone, email, experience_years, consultation_fee, is_available, is_verified, verification_status, license_number, created_by_clinic_id, bvc_certificate_url, nid_number, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Doctor | null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: clinicAffiliations, isLoading: affiliationsLoading } = useQuery({
    queryKey: ['doctor-affiliations', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];

      const { data, error } = await supabase
        .from('clinic_doctors')
        .select(`
          *,
          clinic:clinics(id, name, address, image_url)
        `)
        .eq('doctor_id', doctorProfile.id);

      if (error) throw error;
      return data as ClinicDoctor[];
    },
    enabled: !!doctorProfile?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: doctorAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['doctor-appointments', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(id, name, address, phone)
        `)
        .eq('doctor_id', doctorProfile.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!doctorProfile?.id,
    staleTime: 30 * 1000, // 30 seconds - appointments change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Doctor>) => {
      if (!doctorProfile?.id) throw new Error('No doctor profile');

      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorProfile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error(error);
    },
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select('*, clinic:clinics(name)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      
      // Notify the pet parent about the status change
      if (data?.user_id) {
        try {
          const { createNotification } = await import('@/lib/notifications');
          await createNotification({
            userId: data.user_id,
            type: 'appointment',
            title: data.status === 'confirmed' 
              ? '✅ Appointment Confirmed!'
              : data.status === 'cancelled'
              ? '❌ Appointment Cancelled'
              : '✔️ Appointment Completed',
            message: `Your appointment at ${data.clinic?.name || 'the clinic'} has been ${data.status}.`,
            targetAppointmentId: data.id,
          });
        } catch (err) {
          console.error('Failed to send notification:', err);
        }
      }
      
      const statusMessages: Record<string, string> = {
        confirmed: 'Appointment confirmed! Patient has been notified.',
        cancelled: 'Appointment cancelled. Patient has been notified.',
        completed: 'Appointment marked as completed!',
      };
      toast.success(statusMessages[data.status] || 'Appointment status updated');
    },
    onError: (error) => {
      toast.error('Failed to update appointment');
      console.error(error);
    },
  });

  return {
    doctorProfile,
    profileLoading,
    clinicAffiliations,
    affiliationsLoading,
    doctorAppointments,
    appointmentsLoading,
    updateProfile,
    updateAppointmentStatus,
  };
};

// Public doctor info - uses doctors_public view for security (excludes email, phone, license)
export const useDoctorById = (doctorId: string | undefined) => {
  return useQuery({
    queryKey: ['doctor-public', doctorId],
    queryFn: async () => {
      if (!doctorId) return null;

      // Use doctors_public view - excludes sensitive contact info (email, phone, license_number)
      const { data, error } = await supabase
        .from('doctors_public')
        .select('id, name, specialization, qualifications, avatar_url, bio, experience_years, consultation_fee, is_available, is_verified, created_by_clinic_id, created_at, updated_at')
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      // Cast to partial Doctor type since public view excludes some fields
      return data as Omit<Doctor, 'email' | 'phone' | 'license_number' | 'user_id'>;
    },
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000, // 5 minutes - public data doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Public clinic doctors - uses doctors_public view for security
export const useClinicDoctors = (clinicId: string | undefined) => {
  return useQuery({
    queryKey: ['clinic-doctors-public', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      // Use doctors_public view - excludes sensitive contact info (email, phone, license_number)
      const { data, error } = await supabase
        .from('clinic_doctors')
        .select(`
          *,
          doctor:doctors_public(id, name, specialization, qualifications, avatar_url, bio, experience_years, consultation_fee, is_available, is_verified, created_by_clinic_id)
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'active');

      if (error) throw error;
      // Return with proper typing - doctor field is from doctors_public view
      return data || [];
    },
    enabled: !!clinicId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
