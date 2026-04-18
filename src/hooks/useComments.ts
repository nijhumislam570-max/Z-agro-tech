import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
// Social notifications handled by DB triggers
import { commentSchema } from '@/lib/validations';
import { sanitizeText, isTextSafe } from '@/lib/sanitize';
import type { Comment } from '@/types/social';

export const useComments = (postId: string) => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          pet:pets(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data || []) as Comment[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching comments:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();

    // M-2 Fix: Add real-time subscription for INSERT events on the comments table
    // filtered by post_id so new comments from other users appear instantly.
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          // Fetch full comment with pet join to get the avatar etc.
          supabase
            .from('comments')
            .select('*, pet:pets(*)')
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setComments(prev => {
                  // Avoid duplicates (our own addComment already appended it)
                  if (prev.some(c => c.id === data.id)) return prev;
                  return [...prev, data as Comment];
                });
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, fetchComments]);

  const addComment = async (content: string, commenterPetId?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    // Sanitize content before validation
    const sanitizedContent = sanitizeText(content, { maxLength: 2000, allowNewlines: false });
    
    // Check for dangerous content
    if (!isTextSafe(sanitizedContent)) {
      return { success: false, error: 'Comment contains invalid content' };
    }

    // Validate content with Zod schema
    const validation = commentSchema.safeParse({ content: sanitizedContent });
    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Invalid comment';
      return { success: false, error: errorMessage };
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ 
          post_id: postId, 
          user_id: user.id, 
          pet_id: commenterPetId,
          content: validation.data.content 
        })
        .select(`
          *,
          pet:pets(*)
        `)
        .single();

      if (error) throw error;
      setComments(prev => [...prev, data as Comment]);

      // Social notification handled by DB trigger (notify_on_comment)
      return { success: true };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error adding comment:', error);
      }
      return { success: false, error: 'Failed to add comment' };
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  return { comments, loading, addComment, deleteComment, refreshComments: fetchComments };
};
