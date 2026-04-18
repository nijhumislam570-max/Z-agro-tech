import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SupportConversation {
  id: string;
  user_id: string;
  status: string;
  subject: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched
  user_name?: string;
  user_email?: string;
  unread_count?: number;
  last_message?: string;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

// Hook for customers to manage their support conversation
export const useCustomerSupportChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Find or create conversation
  const initConversation = useCallback(async () => {
    if (!user) return null;

    const { data: existing } = await supabase
      .from('support_conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
      return existing.id;
    }

    const { data: newConv, error } = await supabase
      .from('support_conversations')
      .insert({ user_id: user.id, subject: 'Support Request' })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating support conversation:', error);
      return null;
    }

    setConversationId(newConv.id);
    return newConv.id;
  }, [user]);

  // Fetch messages for conversation
  const fetchMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (!error && isMountedRef.current) {
      setMessages((data || []) as SupportMessage[]);
    }
    if (isMountedRef.current) setLoading(false);
  }, []);

  // Init and subscribe
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const convId = await initConversation();
      if (!convId || !isMountedRef.current) return;

      await fetchMessages(convId);

      channel = supabase
        .channel(`support-messages:${convId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${convId}`,
        }, (payload) => {
          if (isMountedRef.current) {
            setMessages(prev => [...prev, payload.new as SupportMessage]);
          }
        })
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, initConversation, fetchMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !conversationId || !content.trim()) return;

    const { sanitizeText, isTextSafe } = await import('@/lib/sanitize');
    const sanitized = sanitizeText(content, { maxLength: 2000 });
    if (!sanitized || !isTextSafe(sanitized)) return;

    await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: 'user',
      content: sanitized,
    });
  }, [user, conversationId]);

  return { messages, loading, sendMessage, conversationId };
};

// Hook for admin to manage all support conversations
export const useAdminSupportChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['admin-support-conversations'],
    queryFn: async () => {
      const { data: convs, error } = await supabase
        .from('support_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      if (!convs?.length) return [] as SupportConversation[];

      const userIds = [...new Set(convs.map((c: any) => c.user_id))];

      // Batch fetch user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // Batch fetch unread counts + last messages
      const convIds = convs.map((c: any) => c.id);

      const { data: unreadData } = await supabase
        .from('support_messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('is_read', false)
        .eq('sender_role', 'user');

      const unreadMap = new Map<string, number>();
      for (const msg of unreadData || []) {
        unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
      }

      const { data: lastMsgs } = await supabase
        .from('support_messages')
        .select('conversation_id, content')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      const lastMsgMap = new Map<string, string>();
      for (const msg of lastMsgs || []) {
        if (!lastMsgMap.has(msg.conversation_id)) {
          lastMsgMap.set(msg.conversation_id, msg.content);
        }
      }

      return convs.map((c: any) => {
        const profile = profileMap.get(c.user_id);
        return {
          ...c,
          user_name: (profile as any)?.full_name || 'Unknown User',
          unread_count: unreadMap.get(c.id) || 0,
          last_message: lastMsgMap.get(c.id) || '',
        } as SupportConversation;
      });
    },
    enabled: !!user, // RLS enforces admin-only access; non-admins get empty results
    staleTime: 1000 * 30,
  });

  // Realtime subscription for new conversations
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-convs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_conversations',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return { conversations, loading: isLoading };
};

// Hook for admin to view/send messages in a specific conversation
export const useAdminSupportMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && isMountedRef.current) {
      setMessages((data || []) as SupportMessage[]);
    }
    if (isMountedRef.current) setLoading(false);

    // Mark user messages as read
    if (user) {
      await supabase
        .from('support_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_role', 'user')
        .eq('is_read', false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    fetchMessages();

    if (!conversationId) return;

    const channel = supabase
      .channel(`admin-support-msgs:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        if (isMountedRef.current) {
          setMessages(prev => [...prev, payload.new as SupportMessage]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !conversationId || !content.trim()) return;

    const { sanitizeText, isTextSafe } = await import('@/lib/sanitize');
    const sanitized = sanitizeText(content, { maxLength: 2000 });
    if (!sanitized || !isTextSafe(sanitized)) return;

    await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: 'admin',
      content: sanitized,
    });
  }, [user, conversationId]);

  return { messages, loading, sendMessage };
};
