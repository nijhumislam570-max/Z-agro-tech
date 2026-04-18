import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
// Social notifications handled by DB triggers
import { usePets } from '@/contexts/PetContext';
import type { Post } from '@/types/social';

const PAGE_SIZE = 10;

/**
 * Hook for managing posts with cursor-based infinite scroll and optimistic likes.
 * Loads PAGE_SIZE posts at a time, triggered by `loadMore`.
 */
export const usePosts = (petId?: string, feedType: 'all' | 'following' | 'pet' = 'all') => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Guard against state updates on unmounted components (e.g. user navigates
  // away while a page fetch or like request is still in-flight).
  const isMountedRef = useRef(true);

  // Track followed pet IDs for the 'following' feed to avoid re-fetching
  const followedIdsRef = useRef<string[] | null>(null);

  // Set isMountedRef to false on unmount so in-flight async callbacks
  // can skip state updates on a dead component tree.
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Reset state when feed type or pet changes
  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    followedIdsRef.current = null;
  }, [petId, feedType, user?.id]);

  const fetchPage = useCallback(async (cursor?: string, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // For 'following' feed, get followed pet IDs first (cached across pages)
      if (feedType === 'following' && user) {
        if (!followedIdsRef.current) {
          const { data: follows } = await supabase
            .from('follows')
            .select('following_pet_id')
            .eq('follower_user_id', user.id);

          followedIdsRef.current = follows?.map(f => f.following_pet_id) || [];
        }

        if (followedIdsRef.current.length === 0) {
          if (!isMountedRef.current) return;
          setPosts([]);
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      }

      let query = supabase
        .from('posts')
        .select(`*, pet:pets(*)`)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      // Apply cursor for pagination
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      // Apply filters
      if (feedType === 'pet' && petId) {
        query = query.eq('pet_id', petId);
      } else if (feedType === 'following' && followedIdsRef.current) {
        query = query.in('pet_id', followedIdsRef.current);
      }

      const { data, error } = await query;
      if (error) throw error;

      const newPosts = data || [];

      // Check if user liked each post
      let postsWithLikes = newPosts;
      if (user && newPosts.length > 0) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', newPosts.map(p => p.id));

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
        postsWithLikes = newPosts.map(post => ({
          ...post,
          liked_by_user: likedPostIds.has(post.id)
        }));
      }

      // Skip state updates if component unmounted during async work
      if (!isMountedRef.current) return;

      // Determine if there are more posts
      setHasMore(newPosts.length === PAGE_SIZE);

      if (isLoadMore) {
        setPosts(prev => {
          // Deduplicate in case of race conditions
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = postsWithLikes.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew] as Post[];
        });
      } else {
        setPosts(postsWithLikes as Post[]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching posts:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [petId, feedType, user]);

  // Initial fetch
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || posts.length === 0) return;
    const lastPost = posts[posts.length - 1];
    fetchPage(lastPost.created_at, true);
  }, [loadingMore, hasMore, posts, fetchPage]);

  const refreshPosts = useCallback(() => {
    followedIdsRef.current = null;
    setPosts([]);
    setHasMore(true);
    fetchPage();
  }, [fetchPage]);

  const likePost = useCallback(async (postId: string, likerPetId?: string) => {
    if (!user) return;

    // Optimistic update
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, likes_count: post.likes_count + 1, liked_by_user: true }
        : post
    ));

    try {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: user.id, pet_id: likerPetId });

      if (error) throw error;

      // Social notification handled by DB trigger (notify_on_like)
    } catch (error) {
      // Rollback
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, likes_count: Math.max(0, post.likes_count - 1), liked_by_user: false }
          : post
      ));
      if (import.meta.env.DEV) {
        console.error('Error liking post:', error);
      }
    }
  }, [user, activePet]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user) return;

    // Optimistic update
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, likes_count: Math.max(0, post.likes_count - 1), liked_by_user: false }
        : post
    ));

    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      // Rollback
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, likes_count: post.likes_count + 1, liked_by_user: true }
          : post
      ));
      if (import.meta.env.DEV) {
        console.error('Error unliking post:', error);
      }
    }
  }, [user]);

  const updatePostCommentCount = useCallback((postId: string, delta: number) => {
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, comments_count: Math.max(0, (post.comments_count || 0) + delta) }
        : post
    ));
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    likePost,
    unlikePost,
    loadMore,
    refreshPosts,
    updatePostCommentCount,
  };
};
