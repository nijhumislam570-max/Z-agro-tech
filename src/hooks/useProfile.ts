import { useEffect, useState, useCallback } from 'react';
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

export const useProfile = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data as ProfileRow | null);
    } catch {
      toast.error('Could not load your profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (patch: ProfileUpdateInput) => {
    if (!userId) return false;

    // H2: Validate + sanitize before write. Coerce nulls to empty for schema.
    const candidate = {
      full_name: patch.full_name ?? '',
      phone: patch.phone ?? '',
      address: patch.address ?? '',
      division: patch.division ?? '',
      district: patch.district ?? '',
      thana: patch.thana ?? '',
    };
    const parsed = profileSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'Invalid profile data');
      return false;
    }

    setSaving(true);
    try {
      // M3: Upsert handles legacy users whose profile row may be missing.
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: userId, ...patch },
          { onConflict: 'user_id' },
        )
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) setProfile(data as ProfileRow);
      toast.success('Profile updated');
      return true;
    } catch {
      toast.error('Could not save profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId]);

  return { profile, loading, saving, updateProfile, refetch: fetchProfile };
};
