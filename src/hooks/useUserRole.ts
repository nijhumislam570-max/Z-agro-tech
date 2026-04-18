import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type UserRoleType = 'user' | 'doctor' | 'clinic_owner' | 'admin';

interface UserRoleData {
  roles: UserRoleType[];
  primaryRole: UserRoleType;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isUser: boolean;
  isDoctor: boolean;
  isClinicOwner: boolean;
  isAdmin: boolean;
  refetch: () => void;
}

// Priority order for determining primary role
const ROLE_PRIORITY: UserRoleType[] = ['admin', 'clinic_owner', 'doctor', 'user'];

export const useUserRole = (): UserRoleData => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: roles, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user-roles-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserRoleType[];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching user roles:', error);
        throw error;
      }

      return (data?.map(r => r.role) as UserRoleType[]) || [];
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 30, // 30 seconds — keeps role data fresh after admin changes
    refetchOnWindowFocus: true, // Re-check role when user returns to tab
    retry: 2,
  });

  // Realtime subscription: invalidate role cache when user_roles changes for this user
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-role-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate cached roles so the guard re-evaluates immediately
          queryClient.invalidateQueries({ queryKey: ['user-roles-all', user.id] });
          toast.info('Your permissions have been updated.', { id: 'role-sync' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const currentRoles = roles || [];
  
  // Determine primary role by priority
  const primaryRole = ROLE_PRIORITY.find(r => currentRoles.includes(r)) || 'user';

  return {
    roles: currentRoles,
    primaryRole,
    isLoading: isLoading || authLoading,
    isError,
    error: error as Error | null,
    isUser: currentRoles.length === 0 || currentRoles.includes('user'),
    isDoctor: currentRoles.includes('doctor'),
    isClinicOwner: currentRoles.includes('clinic_owner'),
    isAdmin: currentRoles.includes('admin'),
    refetch,
  };
};
