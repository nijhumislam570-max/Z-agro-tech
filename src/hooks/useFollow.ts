import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
// Social notifications handled by DB triggers

/**
 * Hook for managing follow/unfollow state with optimistic updates
 * Provides instant UI feedback while syncing with database in background
 */
export const useFollow = (petId: string) => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFollowStatus = useCallback(async () => {
    try {
      // Check if current user follows this pet
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_user_id', user.id)
          .eq('following_pet_id', petId)
          .maybeSingle();

        setIsFollowing(!!followData);
      }

      // Get followers count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_pet_id', petId);

      setFollowersCount(followers || 0);

      // Get following count (pets this pet's owner follows)
      const { data: petData } = await supabase
        .from('pets')
        .select('user_id')
        .eq('id', petId)
        .single();

      if (petData) {
        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_user_id', petData.user_id);

        setFollowingCount(following || 0);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching follow status:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [petId, user]);

  useEffect(() => {
    if (petId) {
      fetchFollowStatus();
    }
  }, [petId, fetchFollowStatus]);

  const follow = useCallback(async (followerPetId?: string) => {
    if (!user) return;

    // Optimistic update - update UI immediately
    const previousIsFollowing = isFollowing;
    const previousFollowersCount = followersCount;
    
    setIsFollowing(true);
    setFollowersCount(prev => prev + 1);

    try {
      const { error } = await supabase
        .from('follows')
        .insert({ 
          follower_user_id: user.id, 
          follower_pet_id: followerPetId,
          following_pet_id: petId 
        });

      if (error) throw error;

      // Social notification handled by DB trigger (notify_on_follow)
    } catch (error) {
      // Rollback on error
      setIsFollowing(previousIsFollowing);
      setFollowersCount(previousFollowersCount);
      
      if (import.meta.env.DEV) {
        console.error('Error following:', error);
      }
    }
  }, [user, petId, activePet, isFollowing, followersCount]);

  const unfollow = useCallback(async () => {
    if (!user) return;

    // Optimistic update - update UI immediately
    const previousIsFollowing = isFollowing;
    const previousFollowersCount = followersCount;
    
    setIsFollowing(false);
    setFollowersCount(prev => Math.max(0, prev - 1));

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_user_id', user.id)
        .eq('following_pet_id', petId);

      if (error) throw error;
    } catch (error) {
      // Rollback on error
      setIsFollowing(previousIsFollowing);
      setFollowersCount(previousFollowersCount);
      
      if (import.meta.env.DEV) {
        console.error('Error unfollowing:', error);
      }
    }
  }, [user, petId, isFollowing, followersCount]);

  return { 
    isFollowing, 
    followersCount, 
    followingCount, 
    loading, 
    follow, 
    unfollow 
  };
};
