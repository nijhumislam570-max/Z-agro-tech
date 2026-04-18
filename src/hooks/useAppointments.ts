import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getClinicOwnerUserId, createNotification } from '@/lib/notifications';

export const useAppointmentActions = () => {
  const queryClient = useQueryClient();

  const cancelAppointment = useMutation({
    mutationFn: async ({ 
      appointmentId, 
      clinicId, 
      clinicName 
    }: { 
      appointmentId: string; 
      clinicId: string;
      clinicName?: string;
    }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      const clinicOwnerId = await getClinicOwnerUserId(clinicId);
      if (clinicOwnerId) {
        await createNotification({
          userId: clinicOwnerId,
          type: 'appointment',
          title: 'Appointment Cancelled',
          message: `A patient has cancelled their appointment${clinicName ? ` at ${clinicName}` : ''}.`,
          targetAppointmentId: appointmentId,
          targetClinicId: clinicId,
        });
      }

      return { appointmentId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['userAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      toast.success('Your appointment has been cancelled successfully.');
    },
    onError: (error) => {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment. Please try again.');
    },
  });

  return {
    cancelAppointment,
  };
};
