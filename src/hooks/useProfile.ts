import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
    setSaving(true);
    try {
      // Profile auto-create trigger ensures a row exists; update directly.
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('user_id', userId)
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
