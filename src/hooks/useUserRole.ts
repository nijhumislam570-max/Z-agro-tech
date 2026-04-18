import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Z Agro Tech roles. The DB enum is `admin | user`. The frontend treats
 * any non-admin user as 'user'.
 */
export type UserRoleType = 'user' | 'admin';

interface UserRoleData {
  roles: UserRoleType[];
  primaryRole: UserRoleType;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isAdmin: boolean;
  refetch: () => void;
}

const ROLE_PRIORITY: UserRoleType[] = ['admin', 'user'];

export const useUserRole = (): UserRoleData => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: roles, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['user-roles-all', user?.id],
    queryFn: async (): Promise<UserRoleType[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching user roles:', error);
        throw error;
      }

      // Map DB roles to Z Agro roles — anything not 'admin' collapses to 'user'.
      const mapped = (data ?? []).map((r) => (r.role === 'admin' ? 'admin' : 'user') as UserRoleType);
      return Array.from(new Set(mapped));
    },
    enabled: !!user?.id && !authLoading,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Realtime: invalidate role cache when user_roles changes for this user
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
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-roles-all', user.id] });
          toast.info('Your permissions have been updated.', { id: 'role-sync' });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const currentRoles = roles ?? [];
  const primaryRole = ROLE_PRIORITY.find((r) => currentRoles.includes(r)) ?? 'user';

  return {
    roles: currentRoles,
    primaryRole,
    isLoading: isLoading || authLoading,
    isError,
    error: (error as Error | null) ?? null,
    isAdmin: currentRoles.includes('admin'),
    refetch,
  };
};
