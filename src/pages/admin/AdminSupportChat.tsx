import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { MessageCircle, Send, Loader2, ArrowLeft, Search, Trash2, User } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useAdminSupportChat,
  useAdminSupportMessages,
  type SupportConversation,
  type SupportMessage,
} from '@/hooks/useSupportChat';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Conversation list item
const ConversationItem = memo(({ conv, isActive, onClick, onDelete }: {
  conv: SupportConversation; isActive: boolean; onClick: () => void; onDelete: (id: string) => void;
}) => (
  <div className={cn(
    'w-full text-left p-3 rounded-xl transition-colors group relative',
    isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/60'
  )}>
    <button onClick={onClick} className="w-full text-left min-h-[44px]">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold">
            {(conv.user_name || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm truncate">{conv.user_name || 'User'}</span>
            {conv.unread_count && conv.unread_count > 0 ? (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] flex-shrink-0">
                {conv.unread_count}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {conv.last_message || 'No messages yet'}
          </p>
          <span className="text-[10px] text-muted-foreground">
            {conv.last_message_at && formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </button>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 min-h-[44px] min-w-[44px] opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the conversation with <strong>{conv.user_name || 'this user'}</strong> and all its messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => onDelete(conv.id)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
));
ConversationItem.displayName = 'ConversationItem';

// Message bubble
const AdminChatBubble = memo(({ message, isAdmin }: { message: SupportMessage; isAdmin: boolean }) => (
  <div className={cn('flex gap-2', isAdmin ? 'justify-end' : 'justify-start')}>
    {!isAdmin && (
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarFallback className="bg-muted text-xs">U</AvatarFallback>
      </Avatar>
    )}
    <div className={cn(
      'max-w-[75%] rounded-2xl px-3.5 py-2',
      isAdmin
        ? 'bg-primary text-primary-foreground rounded-br-sm'
        : 'bg-muted rounded-bl-sm'
    )}>
      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      <span className={cn(
        'text-[10px] mt-0.5 block',
        isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
      </span>
    </div>
    {isAdmin && (
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-xs">A</AvatarFallback>
      </Avatar>
    )}
  </div>
));
AdminChatBubble.displayName = 'AdminChatBubble';

// Chat panel header showing customer info
const ChatHeader = memo(({ userName, onBack, showBack }: {
  userName: string; onBack?: () => void; showBack?: boolean;
}) => (
  <div className="px-4 py-3 border-b flex items-center gap-3 bg-muted/30">
    {showBack && (
      <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px] min-w-[44px]" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
    )}
    <Avatar className="h-8 w-8">
      <AvatarFallback className="bg-primary/10 text-xs font-semibold">
        {userName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate">{userName}</p>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <User className="h-3 w-3" /> Customer
      </p>
    </div>
  </div>
));
ChatHeader.displayName = 'ChatHeader';

// Chat panel component (reused in both desktop & mobile sheet)
const ChatPanel = memo(({ conversationId, customerName, onBack, showBack }: {
  conversationId: string | null;
  customerName?: string;
  onBack?: () => void;
  showBack?: boolean;
}) => {
  const { messages, loading, sendMessage } = useAdminSupportMessages(conversationId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await sendMessage(input);
    setInput('');
    setSending(false);
  }, [input, sending, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose a chat from the list to start replying</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        userName={customerName || 'Customer'}
        onBack={onBack}
        showBack={showBack}
      />

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-1/2 ml-auto" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No messages in this conversation yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <AdminChatBubble
                key={msg.id}
                message={msg}
                isAdmin={msg.sender_role === 'admin'}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Reply to customer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            maxLength={2000}
            className="flex-1 min-h-[44px] max-h-32 resize-none text-base md:text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="h-11 w-11 flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
});
ChatPanel.displayName = 'ChatPanel';

const AdminSupportChat = () => {
  useDocumentTitle('Support Chat - Admin');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { conversations, loading } = useAdminSupportChat();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() =>
    conversations.filter(c =>
      (c.user_name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (c.last_message || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    ), [conversations, debouncedSearch]);

  const totalUnread = useMemo(() =>
    conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [conversations]);

  const activeConversation = useMemo(() =>
    conversations.find(c => c.id === activeConvId),
    [conversations, activeConvId]);

  const handleConvClick = useCallback((id: string) => {
    setActiveConvId(id);
    if (isMobile) setMobileSheetOpen(true);
  }, [isMobile]);

  const handleDelete = useCallback(async (convId: string) => {
    const { error } = await supabase.from('support_conversations').delete().eq('id', convId);
    if (error) {
      toast.error('Failed to delete conversation');
      return;
    }
    toast.success('Chat deleted successfully');
    if (activeConvId === convId) setActiveConvId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-support-conversations'] });
  }, [activeConvId, queryClient]);

  return (
    <AdminLayout title="Support Chat" subtitle={totalUnread > 0 ? `${totalUnread} unread` : 'Real-time customer support'}>

      <div className="flex h-[calc(100vh-12rem)] bg-card border rounded-xl overflow-hidden">
        {/* Conversation List */}
        <div className={cn(
          'flex flex-col border-r',
          isMobile ? 'w-full' : 'w-[320px] flex-shrink-0'
        )}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 text-base md:text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-2.5 w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">
                  {debouncedSearch ? 'No results found' : 'No conversations'}
                </p>
                <p className="text-xs mt-1">
                  {debouncedSearch ? 'Try a different search term' : 'Support chats will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConvId === conv.id}
                    onClick={() => handleConvClick(conv.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Desktop Chat Panel */}
        {!isMobile && (
          <div className="flex-1 flex flex-col">
            <ChatPanel
              conversationId={activeConvId}
              customerName={activeConversation?.user_name}
            />
          </div>
        )}

        {/* Mobile Chat Sheet */}
        {isMobile && (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="right" className="w-full p-0 flex flex-col">
              <ChatPanel
                conversationId={activeConvId}
                customerName={activeConversation?.user_name}
                onBack={() => setMobileSheetOpen(false)}
                showBack
              />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupportChat;
