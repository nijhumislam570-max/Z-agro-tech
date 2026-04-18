import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { profileSchema } from '@/lib/validations';

export interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  division: string | null;
  district: string | null;
  thana: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  full_name?: string | null;
  phone?: string | null;
  address?: string | null;
  division?: string | null;
  district?: string | null;
  thana?: string | null;
}

const profileKey = (userId: string | null) => ['profile', userId] as const;

/**
 * Profile hook — react-query backed so the cache is shared across
 * Dashboard tabs (Wishlist/Orders/Profile) and auto-refreshes after edits.
 *
 * Public API kept identical to the previous useState/useEffect version so
 * existing callers continue to work: { profile, loading, saving, updateProfile, refetch }.
 */
export const useProfile = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5min — profile rarely changes
    queryFn: async (): Promise<ProfileRow | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileRow | null;
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: ProfileUpdateInput): Promise<ProfileRow | null> => {
      if (!userId) throw new Error('Not signed in');

      // Validate + sanitize before write. Coerce nulls to empty for schema.
      const parsed = profileSchema.safeParse({
        full_name: patch.full_name ?? '',
        phone: patch.phone ?? '',
        address: patch.address ?? '',
        division: patch.division ?? '',
        district: patch.district ?? '',
        thana: patch.thana ?? '',
      });
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message ?? 'Invalid profile data');
      }

      // Upsert handles legacy users whose profile row may be missing.
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as ProfileRow | null;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(profileKey(userId), data);
      queryClient.invalidateQueries({ queryKey: profileKey(userId) });
      toast.success('Profile updated');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Could not save profile';
      toast.error(msg);
    },
  });

  // Stable wrapper for backward compat — returns boolean instead of throwing.
  const updateProfile = useCallback(
    async (patch: ProfileUpdateInput): Promise<boolean> => {
      try {
        await mutation.mutateAsync(patch);
        return true;
      } catch {
        return false;
      }
    },
    [mutation],
  );

  return {
    profile: query.data ?? null,
    loading: query.isLoading,
    saving: mutation.isPending,
    updateProfile,
    refetch: query.refetch,
  };
};
