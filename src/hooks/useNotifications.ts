import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Notification } from '@/types/social';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [] as Notification[];

      // H-3 Fix: removed 'as any' cast — notifications is properly typed in schema.
      // The FK join actor_pet is safe because actor_pet_id is nullable and
      // PostgREST returns null for the joined object when actor_pet_id is null.
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor_pet:pets!notifications_actor_pet_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate instead of optimistic set to get joined actor_pet data
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          
          // Show toast for new notifications
          if (payload.eventType === 'INSERT' && payload.new) {
            const n = payload.new as { title?: string; message?: string };
            toast(n.title || 'New notification', {
              description: n.message || undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const notifications = data || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    // Optimistic update
    queryClient.setQueryData<Notification[]>(
      ['notifications', user.id],
      (old) => old?.map(n => n.id === notificationId ? { ...n, is_read: true } : n) || []
    );

    // H-3 Fix: Check the error from markAsRead and revert optimistic update on failure
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      if (import.meta.env.DEV) {
        console.error('Error marking notification as read:', error);
      }
    }
  }, [user, queryClient]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    // Optimistic update
    queryClient.setQueryData<Notification[]>(
      ['notifications', user.id],
      (old) => old?.map(n => ({ ...n, is_read: true })) || []
    );

    // H-3 Fix: Check the error and revert on failure
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      toast.error('Failed to mark notifications as read');
      if (import.meta.env.DEV) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  }, [user, queryClient]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  }, [user?.id, queryClient]);

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};
