import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { STALE_1MIN } from '@/lib/queryConstants';

export function useMyOrders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-orders', user?.id],
    enabled: !!user,
    staleTime: STALE_1MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id,status,total_amount,created_at,items,tracking_id,payment_method,shipping_address,consignment_id,rejection_reason,payment_status')
        .eq('user_id', user!.id)
        .is('trashed_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
