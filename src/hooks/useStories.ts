import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';
import { toast } from 'sonner';
import type { Story, StoryGroup, Pet } from '@/types/social';

export const useStories = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // L-3 Fix: Wrap fetchStories in useCallback so it has a stable reference.
  // This prevents unnecessary re-renders in consumers that depend on `refresh`.
  const fetchStories = useCallback(async () => {
    try {
      // H-3 Fix: removed 'as any' — stories is properly typed in the schema.
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          pet:pets(*)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get viewed story IDs for current user
      let viewedStoryIds: Set<string> = new Set();
      if (user) {
        // H-3 Fix: removed 'as any' — story_views is properly typed in the schema.
        const { data: views, error: viewsError } = await supabase
          .from('story_views')
          .select('story_id')
          .eq('viewer_user_id', user.id);
        
        // Only log genuine errors, not missing data
        if (viewsError && import.meta.env.DEV) {
          console.error('Error fetching story views:', viewsError);
        }
        
        viewedStoryIds = new Set((views || []).map(v => v.story_id));
      }

      // Group stories by pet
      const groupedMap = new Map<string, StoryGroup>();
      
      for (const story of (data || [])) {
        if (!story.pet) continue;
        
        const petId = story.pet_id;
        const viewed = viewedStoryIds.has(story.id);
        
        if (!groupedMap.has(petId)) {
          groupedMap.set(petId, {
            pet: story.pet as Pet,
            stories: [],
            hasUnviewed: false,
          });
        }
        
        const group = groupedMap.get(petId)!;
        group.stories.push({ ...story, viewed } as Story);
        if (!viewed) {
          group.hasUnviewed = true;
        }
      }

      // Sort: unviewed first, then by latest story
      const groups = Array.from(groupedMap.values()).sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return new Date(b.stories[0].created_at).getTime() - new Date(a.stories[0].created_at).getTime();
      });

      setStoryGroups(groups);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching stories:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]); // Stable: only recreated when user changes

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const markAsViewed = async (storyId: string) => {
    if (!user) return;

    try {
      // H-3 Fix: removed 'as any' cast
      const { error } = await supabase
        .from('story_views')
        .insert({ story_id: storyId, viewer_user_id: user.id });
      
      // H-3 Fix: Distinguish duplicate (23505) from genuine errors
      if (error && error.code !== '23505' && import.meta.env.DEV) {
        console.error('Error marking story as viewed:', error);
      }
    } catch (error) {
      // Silently ignore — non-critical action
    }
  };

  const createStory = async (petId: string, file: File, caption?: string) => {
    if (!user) return null;

    try {
      let fileToUpload = file;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      // Compress images before upload
      if (mediaType === 'image') {
        const result = await compressImage(file, 'story');
        fileToUpload = result.file;
        
        if (result.compressionRatio > 1) {
          toast.success(getCompressionMessage(result.originalSize, result.compressedSize));
        }
      }

      // Upload media
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${user.id}/stories/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-media')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-media')
        .getPublicUrl(fileName);

      // Create story — removed 'as any' cast
      const { data, error } = await supabase
        .from('stories')
        .insert({
          pet_id: petId,
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption: caption?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchStories();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating story:', error);
      }
      return null;
    }
  };

  return { 
    storyGroups, 
    loading, 
    markAsViewed, 
    createStory,
    refresh: fetchStories  // L-3 Fix: now stable reference via useCallback
  };
};
