import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Pet } from '@/types/social';

export interface PetFollowData {
  followersCount: number;
  isFollowing: boolean;
}

/**
 * Optimized hook for Explore page: fetches pets + batch follow data in 2-3 queries total
 * instead of N*3 queries (one per pet card).
 */
const PAGE_SIZE = 20;

export const useExplorePets = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState<Pet[]>([]);
  const [followDataMap, setFollowDataMap] = useState<Record<string, PetFollowData>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [species, setSpecies] = useState(searchParams.get('species') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const abortRef = useRef<AbortController | null>(null);

  const fetchPets = useCallback(async (
    overrideQuery?: string,
    overrideSpecies?: string,
    overrideLocation?: string,
    cursor?: string
  ) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isLoadMore = !!cursor;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const q = overrideQuery ?? searchQuery;
      const s = overrideSpecies ?? species;
      const loc = overrideLocation ?? location;

      let query = supabase
        .from('pets')
        .select('id, user_id, name, species, breed, age, avatar_url, location, created_at')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) {
        query = query.lt('created_at', cursor);
      }
      if (q) {
        query = query.or(`name.ilike.%${q}%,breed.ilike.%${q}%`);
      }
      if (s && s !== 'All') {
        query = query.eq('species', s);
      }
      if (loc) {
        query = query.ilike('location', `%${loc}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (controller.signal.aborted) return;

      const petsData = (data || []) as Pet[];
      setHasMore(petsData.length === PAGE_SIZE);

      if (isLoadMore) {
        setPets(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const unique = petsData.filter(p => !existingIds.has(p.id));
          return [...prev, ...unique];
        });
      } else {
        setPets(petsData);
      }

      // Batch fetch follow data for new pets
      if (petsData.length > 0) {
        await fetchBatchFollowData(petsData, controller.signal, isLoadMore);
      } else if (!isLoadMore) {
        setFollowDataMap({});
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (import.meta.env.DEV) {
        console.error('Error fetching pets:', error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [searchQuery, species, location]);

  const fetchBatchFollowData = async (petsData: Pet[], signal: AbortSignal, merge = false) => {
    const petIds = petsData.map(p => p.id);

    try {
      // Query 1: Get follower counts for all pets in one request
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_pet_id')
        .in('following_pet_id', petIds);

      if (followsError) throw followsError;
      if (signal.aborted) return;

      // Count followers per pet
      const followerCounts: Record<string, number> = {};
      (followsData || []).forEach(f => {
        followerCounts[f.following_pet_id] = (followerCounts[f.following_pet_id] || 0) + 1;
      });

      // Query 2: Check which pets the current user follows (only if logged in)
      let userFollowingSet = new Set<string>();
      if (user) {
        const { data: userFollows, error: userFollowsError } = await supabase
          .from('follows')
          .select('following_pet_id')
          .eq('follower_user_id', user.id)
          .in('following_pet_id', petIds);

        if (userFollowsError) throw userFollowsError;
        if (signal.aborted) return;

        userFollowingSet = new Set((userFollows || []).map(f => f.following_pet_id));
      }

      // Build follow data map
      const newMap: Record<string, PetFollowData> = {};
      petIds.forEach(id => {
        newMap[id] = {
          followersCount: followerCounts[id] || 0,
          isFollowing: userFollowingSet.has(id),
        };
      });

      if (merge) {
        setFollowDataMap(prev => ({ ...prev, ...newMap }));
      } else {
        setFollowDataMap(newMap);
      }
    } catch (error) {
      if (signal.aborted) return;
      if (import.meta.env.DEV) {
        console.error('Error fetching batch follow data:', error);
      }
    }
  };

  // Initial fetch and species change — reset pagination
  useEffect(() => {
    setPets([]);
    setHasMore(true);
    fetchPets();
  }, [species]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || pets.length === 0) return;
    const lastPet = pets[pets.length - 1];
    fetchPets(undefined, undefined, undefined, lastPet.created_at);
  }, [loadingMore, hasMore, pets, fetchPets]);

  const handleSearch = useCallback(() => {
    setSearchParams({
      ...(searchQuery && { q: searchQuery }),
      ...(species !== 'All' && { species }),
      ...(location && { location }),
    });
    fetchPets();
  }, [searchQuery, species, location, setSearchParams, fetchPets]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSpecies('All');
    setLocation('');
    setSearchParams({});
    // Pass cleared values directly to avoid stale state
    fetchPets('', 'All', '');
  }, [setSearchParams, fetchPets]);

  // Optimistic follow/unfollow
  const optimisticFollow = useCallback(async (petId: string) => {
    if (!user) return;

    // Optimistic update
    setFollowDataMap(prev => ({
      ...prev,
      [petId]: {
        followersCount: (prev[petId]?.followersCount || 0) + 1,
        isFollowing: true,
      },
    }));

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_user_id: user.id,
          following_pet_id: petId,
        });

      if (error) throw error;
    } catch (error) {
      // Rollback
      setFollowDataMap(prev => ({
        ...prev,
        [petId]: {
          followersCount: Math.max(0, (prev[petId]?.followersCount || 1) - 1),
          isFollowing: false,
        },
      }));
      if (import.meta.env.DEV) {
        console.error('Error following:', error);
      }
    }
  }, [user]);

  const optimisticUnfollow = useCallback(async (petId: string) => {
    if (!user) return;

    // Optimistic update
    setFollowDataMap(prev => ({
      ...prev,
      [petId]: {
        followersCount: Math.max(0, (prev[petId]?.followersCount || 1) - 1),
        isFollowing: false,
      },
    }));

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_user_id', user.id)
        .eq('following_pet_id', petId);

      if (error) throw error;
    } catch (error) {
      // Rollback
      setFollowDataMap(prev => ({
        ...prev,
        [petId]: {
          followersCount: (prev[petId]?.followersCount || 0) + 1,
          isFollowing: true,
        },
      }));
      if (import.meta.env.DEV) {
        console.error('Error unfollowing:', error);
      }
    }
  }, [user]);

  // Cleanup
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const hasActiveFilters = !!(searchQuery || species !== 'All' || location);

  return {
    pets,
    followDataMap,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    species,
    setSpecies,
    location,
    setLocation,
    handleSearch,
    clearFilters,
    hasActiveFilters,
    optimisticFollow,
    optimisticUnfollow,
    loadMore,
  };
};
