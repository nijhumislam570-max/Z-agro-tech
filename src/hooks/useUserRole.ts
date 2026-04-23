import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Z Agro Tech roles. The DB enum is `admin | user`. The frontend treats
 * any non-admin user as 'user'.
 *
 * Simplified per audit: role assignment is enforced by the
 * `enforce_single_admin_trigger` DB trigger and only `nijhumislam570@gmail.com`
 * may hold the admin role. Permissions never change at runtime, so we no
 * longer need a realtime channel or focus-refetch — both were causing global
 * re-render storms across the admin tree on every tab focus.
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
    // Roles only change via DB migration / SQL — keep cache fresh for the whole session.
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2,
  });

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
