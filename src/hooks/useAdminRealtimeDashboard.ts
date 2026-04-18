import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Centralized realtime subscription for ALL admin pages.
 * Split into scoped channels to avoid over-invalidation.
 */
export const useAdminRealtimeDashboard = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) return;

    // ── Orders & E-commerce Channel ──
    const ordersChannel = supabase
      .channel('admin-rt-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Record<string, unknown>;
        if (newOrder.status === 'pending') {
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          toast.info('🛒 New order received!', {
            action: { label: 'View', onClick: () => navigate('/admin/orders') },
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-ecommerce-customers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomplete_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_zones' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-delivery-zones'] });
      })
      .subscribe();

    // ── Clinical Channel (clinics, doctors, appointments) ──
    const clinicalChannel = supabase
      .channel('admin-rt-clinical')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinics' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
        queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
        queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
        queryClient.invalidateQueries({ queryKey: ['cms-clinics-status'] });
        const newClinic = payload.new as Record<string, unknown>;
        if (payload.eventType === 'UPDATE' && newClinic.verification_status === 'pending') {
          toast.info('🏥 New clinic verification request!', {
            action: { label: 'Review', onClick: () => navigate('/admin/clinics') },
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
        queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
        queryClient.invalidateQueries({ queryKey: ['cms-clinical-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cms-pending-doctors'] });
        const newDoctor = payload.new as Record<string, unknown>;
        if (payload.eventType === 'UPDATE' && newDoctor.verification_status === 'pending') {
          toast.info('👨‍⚕️ New doctor verification request!', {
            action: { label: 'Review', onClick: () => navigate('/admin/doctors') },
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_reviews' }, () => {
        queryClient.invalidateQueries({ queryKey: ['clinic-reviews'] });
        queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      })
      .subscribe();

    // ── Social & Content Channel ──
    const socialChannel = supabase
      .channel('admin-rt-social')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
        queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cms-social-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cms-recent-posts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cms_articles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['cms-articles'] });
        queryClient.invalidateQueries({ queryKey: ['cms-stats'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
        if (payload.eventType === 'INSERT') {
          toast.info('📩 New contact message!', {
            action: { label: 'View', onClick: () => navigate('/admin/messages') },
          });
        }
      })
      .subscribe();

    // ── Products & Profiles Channel ──
    const catalogChannel = supabase
      .channel('admin-rt-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        queryClient.invalidateQueries({ queryKey: ['cms-marketplace-stats'] });
        queryClient.invalidateQueries({ queryKey: ['cms-products-quick'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(clinicalChannel);
      supabase.removeChannel(socialChannel);
      supabase.removeChannel(catalogChannel);
    };
  }, [isAdmin, queryClient, navigate]);
};
