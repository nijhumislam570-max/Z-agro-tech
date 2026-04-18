import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Conversation, Message, Pet } from '@/types/social';
import type { ConversationRow } from '@/types/database';
import { compressImage } from '@/lib/mediaCompression';

// H-1 + L-2 Fix: Migrate useConversations to React Query.
// Benefits: shared cache, staleTime, automatic background refetch,
// and no manual isMounted tracking needed (React Query handles it).
export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [] as Conversation[];

      const { data, error } = await supabase
        .from('conversations')
        .select('id, participant_1_id, participant_2_id, last_message_at, created_at')
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // H-1 Fix: Replaced 3 sequential per-conversation queries with a batched
      // approach: fetch ALL pets and last messages in 2 queries, then join in memory.
      // This reduces N*3 round-trips to 3 total, eliminating the N+1 pattern.
      const convList = data || [];
      if (convList.length === 0) return [] as Conversation[];

      const allOtherUserIds = convList.map((conv: ConversationRow) =>
        conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
      );

      // Batch query 1: get one pet per other user
      const { data: allPets } = await supabase
        .from('pets')
        .select('id, user_id, name, species, breed, age, avatar_url, location')
        .in('user_id', allOtherUserIds);

      // Build lookup maps
      const petsByUserId = new Map<string, Pet[]>();
      for (const pet of allPets || []) {
        const list = petsByUserId.get(pet.user_id) || [];
        list.push(pet as Pet);
        petsByUserId.set(pet.user_id, list);
      }

      const convIds = convList.map((c: ConversationRow) => c.id);

      // Batch query 2: get last message per conversation
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, media_url, media_type, is_read, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      const lastMessageByConv = new Map<string, Message>();
      for (const msg of (lastMessages || []) as Message[]) {
        if (!lastMessageByConv.has(msg.conversation_id)) {
          lastMessageByConv.set(msg.conversation_id, msg as Message);
        }
      }

      // Batch query 3: get unread counts per conversation
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      const unreadCountByConv = new Map<string, number>();
      for (const msg of unreadMessages || []) {
        unreadCountByConv.set(
          msg.conversation_id,
          (unreadCountByConv.get(msg.conversation_id) || 0) + 1
        );
      }

      // Assemble enriched conversations
      return convList.map((conv: ConversationRow) => {
        const otherUserId = conv.participant_1_id === user.id
          ? conv.participant_2_id
          : conv.participant_1_id;

        return {
          ...conv,
          other_user: {
            id: otherUserId,
            pets: petsByUserId.get(otherUserId) || [],
          },
          last_message: lastMessageByConv.get(conv.id),
          unread_count: unreadCountByConv.get(conv.id) || 0,
        } as Conversation;
      });
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });

  const startConversation = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${otherUserId}),and(participant_1_id.eq.${otherUserId},participant_2_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) return existing.id;

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user.id,
          participant_2_id: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate cache so the new conversation appears
      queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
      return data.id;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error starting conversation:', error);
      }
      return null;
    }
  };

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
  }, [user?.id, queryClient]);

  return { conversations, loading, startConversation, refresh };
};

export const useMessages = (conversationId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  // H-1 Fix: isMounted ref prevents state updates after unmount (memory leak)
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, media_url, media_type, is_read, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const fetchedMessages = (data || []) as Message[];
      
      // Optimistic is_read: mark unread messages as read in local state immediately
      if (user) {
        const optimisticMessages = fetchedMessages.map(msg =>
          msg.sender_id !== user.id && !msg.is_read
            ? { ...msg, is_read: true }
            : msg
        );
        if (isMountedRef.current) {
          setMessages(optimisticMessages);
        }

        // Then persist to DB (fire-and-forget, no UI delay)
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false)
          .then(); // silent
      } else if (isMountedRef.current) {
        setMessages(fetchedMessages);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching messages:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (isMountedRef.current) {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = async (content: string, mediaFile?: File) => {
    if (!user || !conversationId) return;

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        let fileToUpload = mediaFile;
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';

        // Compress image before upload
        if (mediaType === 'image') {
          const compressed = await compressImage(mediaFile, 'feed');
          fileToUpload = compressed.file;
        }

        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${user.id}/messages/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(fileName, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-media')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim() || null,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (error) throw error;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error sending message:', error);
      }
    }
  };

  return { messages, loading, sendMessage, refresh: fetchMessages };
};
