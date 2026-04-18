import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Centralized realtime subscription for ALL admin pages.
 * Z Agro Tech scope: e-commerce + academy + support only.
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

    // ── Catalog & Customers Channel ──
    const catalogChannel = supabase
      .channel('admin-rt-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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

    // ── Academy Channel ──
    const academyChannel = supabase
      .channel('admin-rt-academy')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(catalogChannel);
      supabase.removeChannel(academyChannel);
    };
  }, [isAdmin, queryClient, navigate]);
};
