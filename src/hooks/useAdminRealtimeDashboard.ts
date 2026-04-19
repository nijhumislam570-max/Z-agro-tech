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

    // Debounced invalidator — coalesces bursty events (e.g., bulk order edits,
    // profile-trigger cascades) into a single refetch per key per ~500ms.
    const pendingInvalidations = new Map<string, ReturnType<typeof setTimeout>>();
    const invalidateDebounced = (key: string, delay = 500) => {
      const existing = pendingInvalidations.get(key);
      if (existing) clearTimeout(existing);
      pendingInvalidations.set(
        key,
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: [key] });
          pendingInvalidations.delete(key);
        }, delay),
      );
    };

    // ── Orders & E-commerce Channel ──
    const ordersChannel = supabase
      .channel('admin-rt-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Record<string, unknown>;
        if (newOrder.status === 'pending') {
          // New pending order genuinely affects all three views — invalidate immediately.
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          toast.info('🛒 New order received!', {
            action: { label: 'View', onClick: () => navigate('/admin/orders') },
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        // Status edits are frequent (admin clicking through statuses) — only the
        // orders list strictly needs a refresh. Stats/customer aggregates can wait
        // for the next mount; debounce them lightly so a burst of edits coalesces.
        invalidateDebounced('admin-orders', 250);
        invalidateDebounced('admin-stats', 1500);
        invalidateDebounced('admin-ecommerce-customers', 1500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomplete_orders' }, () => {
        invalidateDebounced('admin-incomplete-orders', 400);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        invalidateDebounced('admin-coupons', 400);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_zones' }, () => {
        invalidateDebounced('admin-delivery-zones', 400);
      })
      .subscribe();

    // ── Catalog & Customers Channel ──
    const catalogChannel = supabase
      .channel('admin-rt-catalog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        // Skip cosmetic updates (description/badge edits) — only meaningful when
        // status, stock, price, or visibility changes affect the list view.
        if (payload.eventType === 'UPDATE') {
          const oldRow = (payload.old ?? {}) as Record<string, unknown>;
          const newRow = (payload.new ?? {}) as Record<string, unknown>;
          const meaningful =
            oldRow.is_active !== newRow.is_active ||
            oldRow.is_featured !== newRow.is_featured ||
            oldRow.stock !== newRow.stock ||
            oldRow.price !== newRow.price ||
            oldRow.name !== newRow.name;
          if (!meaningful) return;
        }
        invalidateDebounced('admin-products', 400);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        // Profiles fire on every auth login (last_seen-style triggers) — debounce hard.
        invalidateDebounced('admin-users', 800);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, (payload) => {
        invalidateDebounced('admin-contact-messages', 300);
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
        invalidateDebounced('admin-courses', 400);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => {
        invalidateDebounced('admin-enrollments', 400);
      })
      .subscribe();

    return () => {
      pendingInvalidations.forEach((t) => clearTimeout(t));
      pendingInvalidations.clear();
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(catalogChannel);
      supabase.removeChannel(academyChannel);
    };
  }, [isAdmin, queryClient, navigate]);
};
