import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IncompleteOrder {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: any;
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('incomplete-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomplete_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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
    mutationFn: async ({ order, editedData, deliveryCharge = 0, grandTotal }: {
      order: IncompleteOrder;
      editedData: {
        customer_name: string;
        customer_phone: string;
        customer_email: string;
        shipping_address: string;
        division: string;
      };
      deliveryCharge?: number;
      grandTotal?: number;
    }) => {
      await supabase.from('incomplete_orders').update({
        customer_name: editedData.customer_name,
        customer_phone: editedData.customer_phone,
        customer_email: editedData.customer_email,
        shipping_address: editedData.shipping_address,
        division: editedData.division,
        completeness: 100,
      }).eq('id', order.id);

      const shippingAddress = [
        editedData.customer_name,
        editedData.customer_phone,
        editedData.shipping_address,
        editedData.division,
      ].filter(Boolean).join(', ');

      const totalAmount = grandTotal ?? ((order.cart_total || 0) + deliveryCharge);
      const userId = order.user_id || '00000000-0000-0000-0000-000000000000';

      // Use atomic RPC to ensure stock is validated and decremented with FOR UPDATE row locks
      const { data: newOrderId, error: orderError } = await supabase
        .rpc('create_order_with_stock', {
          p_user_id: userId,
          p_items: order.items,
          p_total_amount: totalAmount,
          p_shipping_address: shippingAddress,
          p_payment_method: 'cod',
        });

      if (orderError) throw orderError;

      await supabase
        .from('incomplete_orders')
        .update({ status: 'recovered', recovered_order_id: newOrderId })
        .eq('id', order.id);

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
