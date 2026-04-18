import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createNotification, getClinicOwnerUserId } from '@/lib/notifications';

export interface DoctorJoinRequest {
  id: string;
  doctor_id: string;
  clinic_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: 'doctor' | 'clinic';
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  doctor?: {
    id: string;
    name: string;
    specialization: string | null;
    avatar_url: string | null;
    experience_years: number | null;
    qualifications: string[] | null;
  };
  clinic?: {
    id: string;
    name: string;
    address: string | null;
    image_url: string | null;
    is_verified: boolean;
  };
}

// Hook for doctors to manage their join requests
export const useDoctorJoinRequests = (doctorId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: joinRequests, isLoading } = useQuery({
    queryKey: ['doctor-join-requests', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .select(`
          *,
          clinic:clinics(id, name, address, image_url, is_verified)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DoctorJoinRequest[];
    },
    enabled: !!doctorId,
  });

  // Get pending invitations from clinics
  const pendingInvitations = joinRequests?.filter(
    r => r.requested_by === 'clinic' && r.status === 'pending'
  ) || [];

  // For doctors to request joining a clinic
  const requestJoinClinic = useMutation({
    mutationFn: async ({ clinicId, message }: { clinicId: string; message?: string }) => {
      if (!doctorId) throw new Error('No doctor profile');

      // Get doctor name for notification
      const { data: doctor } = await supabase
        .from('doctors')
        .select('name')
        .eq('id', doctorId)
        .single();

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .insert({
          doctor_id: doctorId,
          clinic_id: clinicId,
          requested_by: 'doctor',
          message: message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Notify clinic owner about new join request
      const clinicOwnerId = await getClinicOwnerUserId(clinicId);
      if (clinicOwnerId) {
        const { data: clinic } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', clinicId)
          .single();

        await createNotification({
          userId: clinicOwnerId,
          type: 'clinic',
          title: '👨‍⚕️ New Doctor Join Request',
          message: `Dr. ${doctor?.name || 'A doctor'} has requested to join "${clinic?.name || 'your clinic'}".`,
          targetClinicId: clinicId,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-join-requests'] });
      toast.success('Join request sent successfully');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('You already have a pending request for this clinic');
      } else {
        toast.error('Failed to send join request');
      }
      console.error(error);
    },
  });

  // For doctors to cancel their pending request
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('doctor_join_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-join-requests'] });
      toast.success('Request cancelled');
    },
    onError: (error) => {
      toast.error('Failed to cancel request');
      console.error(error);
    },
  });

  // For doctors to accept a clinic invitation
  const acceptInvitation = useMutation({
    mutationFn: async (requestId: string) => {
      // Get the request details first
      const { data: request, error: fetchError } = await supabase
        .from('doctor_join_requests')
        .select('doctor_id, clinic_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from('doctor_join_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add doctor to clinic_doctors table
      const { error: insertError } = await supabase
        .from('clinic_doctors')
        .insert({
          doctor_id: request.doctor_id,
          clinic_id: request.clinic_id,
          status: 'active',
        });

      if (insertError && insertError.code !== '23505') throw insertError;

      // Notify clinic owner
      const clinicOwnerId = await getClinicOwnerUserId(request.clinic_id);
      if (clinicOwnerId) {
        const { data: clinic } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', request.clinic_id)
          .single();

        const { data: doctor } = await supabase
          .from('doctors')
          .select('name')
          .eq('id', request.doctor_id)
          .single();

        await createNotification({
          userId: clinicOwnerId,
          type: 'clinic',
          title: '✅ Doctor Accepted Invitation',
          message: `Dr. ${doctor?.name || 'A doctor'} has accepted your invitation to join "${clinic?.name || 'your clinic'}".`,
          targetClinicId: request.clinic_id,
        });
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-affiliations'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-affiliations'] });
      toast.success('Invitation accepted! You are now affiliated with this clinic.');
    },
    onError: (error) => {
      toast.error('Failed to accept invitation');
      console.error(error);
    },
  });

  // For doctors to reject a clinic invitation
  const rejectInvitation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: request } = await supabase
        .from('doctor_join_requests')
        .select('doctor_id, clinic_id')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('doctor_join_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Notify clinic owner
      if (request) {
        const clinicOwnerId = await getClinicOwnerUserId(request.clinic_id);
        if (clinicOwnerId) {
          const { data: clinic } = await supabase
            .from('clinics')
            .select('name')
            .eq('id', request.clinic_id)
            .single();

          const { data: doctor } = await supabase
            .from('doctors')
            .select('name')
            .eq('id', request.doctor_id)
            .single();

          await createNotification({
            userId: clinicOwnerId,
            type: 'clinic',
            title: '❌ Doctor Declined Invitation',
            message: `Dr. ${doctor?.name || 'A doctor'} has declined your invitation to join "${clinic?.name || 'your clinic'}".`,
            targetClinicId: request.clinic_id,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-join-requests'] });
      toast.success('Invitation declined');
    },
    onError: (error) => {
      toast.error('Failed to decline invitation');
      console.error(error);
    },
  });

  return {
    joinRequests,
    pendingInvitations,
    isLoading,
    requestJoinClinic,
    cancelRequest,
    acceptInvitation,
    rejectInvitation,
  };
};

// Hook for clinic owners to manage join requests to their clinic
export const useClinicJoinRequests = (clinicId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: joinRequests, isLoading } = useQuery({
    queryKey: ['clinic-join-requests', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .select(`
          *,
          doctor:doctors(id, name, specialization, avatar_url, experience_years, qualifications)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DoctorJoinRequest[];
    },
    enabled: !!clinicId,
  });

  // For clinic owners to approve a join request
  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Get the request details first
      const { data: request, error: fetchError } = await supabase
        .from('doctor_join_requests')
        .select('doctor_id, clinic_id')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update request status
      const { error: updateError } = await supabase
        .from('doctor_join_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Add doctor to clinic_doctors table
      const { error: insertError } = await supabase
        .from('clinic_doctors')
        .insert({
          doctor_id: request.doctor_id,
          clinic_id: request.clinic_id,
          status: 'active',
        });

      if (insertError && insertError.code !== '23505') throw insertError;

      // Notify the doctor that their request was approved
      const { data: doctor } = await supabase
        .from('doctors')
        .select('user_id, name')
        .eq('id', request.doctor_id)
        .single();

      if (doctor?.user_id) {
        const { data: clinic } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', request.clinic_id)
          .single();

        await createNotification({
          userId: doctor.user_id,
          type: 'clinic',
          title: '🎉 Join Request Approved!',
          message: `Your request to join "${clinic?.name || 'the clinic'}" has been approved. You are now affiliated with this clinic.`,
          targetClinicId: request.clinic_id,
        });
      }

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-doctors'] });
      toast.success('Doctor approved and added to clinic');
    },
    onError: (error) => {
      toast.error('Failed to approve request');
      console.error(error);
    },
  });

  // For clinic owners to reject a join request
  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Get request details for notification
      const { data: request } = await supabase
        .from('doctor_join_requests')
        .select('doctor_id, clinic_id')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('doctor_join_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Notify the doctor that their request was rejected
      if (request) {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('user_id')
          .eq('id', request.doctor_id)
          .single();

        if (doctor?.user_id) {
          const { data: clinic } = await supabase
            .from('clinics')
            .select('name')
            .eq('id', request.clinic_id)
            .single();

          await createNotification({
            userId: doctor.user_id,
            type: 'clinic',
            title: '❌ Join Request Declined',
            message: `Your request to join "${clinic?.name || 'the clinic'}" was not approved. You can try requesting to join other clinics.`,
            targetClinicId: request.clinic_id,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-join-requests'] });
      toast.success('Request rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject request');
      console.error(error);
    },
  });

  // For clinic owners to invite a doctor
  const inviteDoctor = useMutation({
    mutationFn: async ({ doctorId, message }: { doctorId: string; message?: string }) => {
      if (!clinicId) throw new Error('No clinic');

      // Get clinic and doctor details for notification
      const { data: clinic } = await supabase
        .from('clinics')
        .select('name')
        .eq('id', clinicId)
        .single();

      const { data: doctor } = await supabase
        .from('doctors')
        .select('user_id, name')
        .eq('id', doctorId)
        .single();

      const { data, error } = await supabase
        .from('doctor_join_requests')
        .insert({
          doctor_id: doctorId,
          clinic_id: clinicId,
          requested_by: 'clinic',
          message: message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Notify the doctor about the invitation
      if (doctor?.user_id) {
        await createNotification({
          userId: doctor.user_id,
          type: 'clinic',
          title: '📩 Clinic Invitation Received',
          message: `"${clinic?.name || 'A clinic'}" has invited you to join their team. View and respond in your dashboard.`,
          targetClinicId: clinicId,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-join-requests'] });
      toast.success('Invitation sent to doctor');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Already sent an invitation to this doctor');
      } else {
        toast.error('Failed to send invitation');
      }
      console.error(error);
    },
  });

  const pendingRequests = joinRequests?.filter(r => r.status === 'pending') || [];

  return {
    joinRequests,
    pendingRequests,
    isLoading,
    approveRequest,
    rejectRequest,
    inviteDoctor,
  };
};

// Hook to get verified clinics for doctors to browse
export const useVerifiedClinics = () => {
  return useQuery({
    queryKey: ['verified-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, image_url, phone, is_verified, rating, services')
        .eq('is_verified', true)
        .eq('is_blocked', false)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};
