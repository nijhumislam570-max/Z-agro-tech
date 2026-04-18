import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Clinic } from '@/types/database';
import { createAppointmentNotification } from '@/lib/notifications';
import { format } from 'date-fns';

export interface ClinicService {
  id: string;
  clinic_id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ClinicDoctor {
  id: string;
  clinic_id: string;
  doctor_id: string;
  status: string;
  joined_at: string;
  doctor?: {
    id: string;
    name: string;
    specialization: string | null;
    avatar_url: string | null;
    phone: string | null;
    email: string | null;
    is_available: boolean;
    qualifications: string[] | null;
    experience_years: number | null;
    consultation_fee: number | null;
    license_number: string | null;
    bio: string | null;
  };
}

export interface DoctorInput {
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  license_number: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  bio: string | null;
  avatar_url: string | null;
}

export const useClinicOwner = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ownedClinic, isLoading: clinicLoading } = useQuery({
    queryKey: ['owned-clinic', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Use order + limit to handle users with multiple clinics (get newest)
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, phone, email, description, rating, image_url, cover_photo_url, is_open, opening_hours, is_verified, verification_status, services, owner_user_id, created_at, bvc_certificate_url, trade_license_url, owner_name, owner_nid, rejection_reason, is_blocked, blocked_reason')
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Clinic | null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: clinicServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['clinic-services', ownedClinic?.id],
    queryFn: async () => {
      if (!ownedClinic?.id) return [];

      const { data, error } = await supabase
        .from('clinic_services')
        .select('id, clinic_id, name, description, price, duration_minutes, is_active, created_at')
        .eq('clinic_id', ownedClinic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClinicService[];
    },
    enabled: !!ownedClinic?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: clinicDoctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['clinic-doctors-list', ownedClinic?.id],
    queryFn: async () => {
      if (!ownedClinic?.id) return [];

      const { data, error } = await supabase
        .from('clinic_doctors')
        .select(`
          *,
          doctor:doctors(id, name, specialization, avatar_url, phone, email, is_available, qualifications, experience_years, consultation_fee, license_number, bio)
        `)
        .eq('clinic_id', ownedClinic.id);

      if (error) throw error;
      return data as ClinicDoctor[];
    },
    enabled: !!ownedClinic?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: clinicAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['clinic-appointments', ownedClinic?.id],
    queryFn: async () => {
      if (!ownedClinic?.id) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(id, name, specialization, avatar_url)
        `)
        .eq('clinic_id', ownedClinic.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!ownedClinic?.id,
    staleTime: 30 * 1000, // 30 seconds - appointments change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const updateClinic = useMutation({
    mutationFn: async (updates: Partial<Clinic>) => {
      if (!ownedClinic?.id) throw new Error('No clinic');

      const { data, error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', ownedClinic.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-clinic'] });
      toast.success('Clinic updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update clinic');
      logger.error(error);
    },
  });

  const addDoctor = useMutation({
    mutationFn: async (doctor: DoctorInput) => {
      if (!ownedClinic?.id) throw new Error('No clinic');

      // Create the doctor — the auto_link_clinic_doctor trigger
      // automatically inserts into clinic_doctors when created_by_clinic_id is set
      const { data: newDoctor, error: doctorError } = await supabase
        .from('doctors')
        .insert({
          ...doctor,
          created_by_clinic_id: ownedClinic.id,
          is_available: true,
          is_verified: false,
        })
        .select()
        .single();

      if (doctorError) throw doctorError;

      return newDoctor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-doctors-list'] });
      toast.success('Doctor added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add doctor');
      logger.error(error);
    },
  });

  const updateDoctor = useMutation({
    mutationFn: async ({ doctorId, updates }: { doctorId: string; updates: Partial<DoctorInput> }) => {
      const { data, error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-doctors-list'] });
      toast.success('Doctor updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update doctor');
      logger.error(error);
    },
  });

  const removeDoctor = useMutation({
    mutationFn: async (doctorId: string) => {
      // First remove from clinic_doctors junction table
      const { error: unlinkError } = await supabase
        .from('clinic_doctors')
        .delete()
        .eq('doctor_id', doctorId)
        .eq('clinic_id', ownedClinic?.id);

      if (unlinkError) throw unlinkError;

      // Then delete the doctor record if created by this clinic
      const { error: deleteError } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctorId)
        .eq('created_by_clinic_id', ownedClinic?.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-doctors-list'] });
      toast.success('Doctor removed successfully');
    },
    onError: (error) => {
      toast.error('Failed to remove doctor');
      logger.error(error);
    },
  });

  const addService = useMutation({
    mutationFn: async (service: Omit<ClinicService, 'id' | 'created_at' | 'clinic_id'>) => {
      if (!ownedClinic?.id) throw new Error('No clinic');

      const { data, error } = await supabase
        .from('clinic_services')
        .insert({ ...service, clinic_id: ownedClinic.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
      toast.success('Service added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add service');
      logger.error(error);
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClinicService> }) => {
      const { data, error } = await supabase
        .from('clinic_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
      toast.success('Service updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update service');
      logger.error(error);
    },
  });

  const deleteService = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('clinic_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-services'] });
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete service');
      logger.error(error);
    },
  });

  const updateDoctorStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('clinic_doctors')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-doctors-list'] });
      toast.success('Doctor status updated');
    },
    onError: (error) => {
      toast.error('Failed to update doctor status');
      logger.error(error);
    },
  });

  const updateAppointmentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // First get the appointment details for notification
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update the appointment status
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Send notification to the user
      if (appointment && ['confirmed', 'cancelled', 'completed'].includes(status)) {
        await createAppointmentNotification({
          userId: appointment.user_id,
          appointmentId: id,
          clinicName: ownedClinic?.name || 'the clinic',
          status: status as 'confirmed' | 'cancelled' | 'completed',
          appointmentDate: format(new Date(appointment.appointment_date), 'MMM d, yyyy'),
          appointmentTime: appointment.appointment_time,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-appointments'] });
      toast.success('Appointment status updated');
    },
    onError: (error) => {
      toast.error('Failed to update appointment');
      logger.error(error);
    },
  });

  // Add walk-in appointment mutation
  const addWalkInAppointment = useMutation({
    mutationFn: async (data: {
      petName: string;
      petType: string;
      ownerName: string;
      ownerPhone: string;
      doctorId: string | null;
      appointmentDate: Date;
      appointmentTime: string;
      reason: string;
    }) => {
      if (!ownedClinic?.id || !user?.id) throw new Error('No clinic or user');

      // Build reason with walk-in info
      const reasonParts = ['[Walk-in]'];
      if (data.ownerName) reasonParts.push(`Owner: ${data.ownerName}`);
      if (data.ownerPhone) reasonParts.push(`Phone: ${data.ownerPhone}`);
      if (data.reason) reasonParts.push(data.reason);
      const fullReason = reasonParts.join(' | ');

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: ownedClinic.id,
          user_id: user.id, // Clinic owner as proxy
          doctor_id: data.doctorId || null,
          pet_name: data.petName,
          pet_type: data.petType,
          appointment_date: format(data.appointmentDate, 'yyyy-MM-dd'),
          appointment_time: data.appointmentTime,
          reason: fullReason,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-appointments'] });
      toast.success('Walk-in appointment created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create appointment');
      logger.error(error);
    },
  });

  return {
    ownedClinic,
    clinicLoading,
    clinicServices,
    servicesLoading,
    clinicDoctors,
    doctorsLoading,
    clinicAppointments,
    appointmentsLoading,
    updateClinic,
    addDoctor,
    updateDoctor,
    removeDoctor,
    addService,
    updateService,
    deleteService,
    updateDoctorStatus,
    updateAppointmentStatus,
    addWalkInAppointment,
  };
};
