import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { OrderItem } from './useAdminAnalytics';
// Realtime invalidation for `incomplete_orders` is handled centrally by
// useAdminRealtimeDashboard — page-level channel removed (audit P0).

export interface IncompleteOrder {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: OrderItem[];
  cart_total: number;
  shipping_address: string | null;
  division: string | null;
  completeness: number;
  status: string;
  recovered_order_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  trashed_at: string | null;
}

export const useIncompleteOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-incomplete-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incomplete_orders')
        .select('id, user_id, customer_name, customer_phone, customer_email, items, cart_total, shipping_address, division, completeness, status, recovered_order_id, expires_at, created_at, updated_at, trashed_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IncompleteOrder[];
    },
  });

  // Soft delete (move to trash)
  const trashMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomplete_orders').update({ trashed_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    },
  });

  // Restore from trash
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomplete_orders').update({ trashed_at: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    },
  });

  // Permanent delete
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomplete_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async ({ order, editedData }: {
      order: IncompleteOrder;
      editedData: {
        customer_name: string;
        customer_phone: string;
        customer_email: string;
        shipping_address: string;
        division: string;
      };
    }) => {
      // Admin recovery has a dedicated RPC because checkout recovery does not
      // run as the customer account that originally started the cart.
      const { data: newOrderId, error: orderError } = await supabase
        .rpc('recover_incomplete_order', {
          p_incomplete_order_id: order.id,
          p_customer_name: editedData.customer_name,
          p_customer_phone: editedData.customer_phone,
          p_customer_email: editedData.customer_email || null,
          p_shipping_address: editedData.shipping_address,
          p_division: editedData.division,
          p_payment_method: 'cod',
        });

      if (orderError) throw orderError;

      return { id: newOrderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // Split active vs trashed
  const activeOrders = orders.filter(o => !o.trashed_at);
  const trashedOrders = orders.filter(o => !!o.trashed_at);

  // Stats (only from active orders)
  const incomplete = activeOrders.filter(o => o.status === 'incomplete');
  const recovered = activeOrders.filter(o => o.status === 'recovered');
  const totalIncomplete = incomplete.length;
  const totalRecovered = recovered.length;
  const totalTrashed = trashedOrders.length;
  const recoveryRate = activeOrders.length > 0 ? Math.round((totalRecovered / activeOrders.length) * 100) : 0;
  const lostRevenue = incomplete.reduce((sum, o) => sum + (o.cart_total || 0), 0);
  const recoveredRevenue = recovered.reduce((sum, o) => sum + (o.cart_total || 0), 0);

  return {
    orders: activeOrders,
    trashedOrders,
    isLoading,
    incomplete,
    recovered,
    totalIncomplete,
    totalRecovered,
    totalTrashed,
    recoveryRate,
    lostRevenue,
    recoveredRevenue,
    trashOrder: trashMutation.mutateAsync,
    restoreOrder: restoreMutation.mutateAsync,
    permanentlyDelete: permanentDeleteMutation.mutateAsync,
    convertOrder: convertMutation.mutateAsync,
    isConverting: convertMutation.isPending,
    isTrashing: trashMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isDeleting: permanentDeleteMutation.isPending,
  };
};
