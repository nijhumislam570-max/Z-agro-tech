import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { removeStorageFiles } from '@/lib/storageUtils';

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      // Fetch media URLs before deletion
      const { data: post } = await supabase.from('posts').select('media_urls').eq('id', postId).single();
      
      await supabase.from('comments').delete().eq('post_id', postId);
      await supabase.from('likes').delete().eq('post_id', postId);
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;

      // Clean up storage files
      if (post?.media_urls && post.media_urls.length > 0) {
        await removeStorageFiles(post.media_urls as string[]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
      toast.success('Post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });
};

export const useDeletePet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (petId: string) => {
      // Collect all storage URLs before deletion
      const urlsToRemove: string[] = [];
      
      const { data: petData } = await supabase.from('pets').select('avatar_url, cover_photo_url').eq('id', petId).single();
      if (petData?.avatar_url) urlsToRemove.push(petData.avatar_url);
      if (petData?.cover_photo_url) urlsToRemove.push(petData.cover_photo_url);

      const { data: petPosts } = await supabase.from('posts').select('id, media_urls').eq('pet_id', petId);
      if (petPosts) {
        for (const post of petPosts) {
          if (post.media_urls) urlsToRemove.push(...(post.media_urls as string[]));
          await supabase.from('comments').delete().eq('post_id', post.id);
          await supabase.from('likes').delete().eq('post_id', post.id);
        }
      }

      const { data: stories } = await supabase.from('stories').select('media_url').eq('pet_id', petId);
      if (stories) {
        for (const story of stories) {
          if (story.media_url) urlsToRemove.push(story.media_url);
        }
      }

      await supabase.from('comments').delete().eq('pet_id', petId);
      await supabase.from('likes').delete().eq('pet_id', petId);
      await supabase.from('posts').delete().eq('pet_id', petId);
      await supabase.from('stories').delete().eq('pet_id', petId);
      await supabase.from('follows').delete().eq('following_pet_id', petId);
      await supabase.from('follows').delete().eq('follower_pet_id', petId);
      const { error } = await supabase.from('pets').delete().eq('id', petId);
      if (error) throw error;

      // Clean up storage
      if (urlsToRemove.length > 0) {
        await removeStorageFiles(urlsToRemove);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pet-parents'] });
      toast.success('Pet profile deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete pet profile');
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data: comment } = await supabase.from('comments').select('post_id').eq('id', commentId).single();
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      toast.success('Comment deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });
};
