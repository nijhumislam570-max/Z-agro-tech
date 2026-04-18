import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerSupportChat, type SupportMessage } from '@/hooks/useSupportChat';
import { cn } from '@/lib/utils';

const ChatBubble = memo(({ message, isOwn }: { message: SupportMessage; isOwn: boolean }) => (
  <div className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
    {!isOwn && (
      <Avatar className="h-7 w-7 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-xs">VM</AvatarFallback>
      </Avatar>
    )}
    <div className={cn(
      'max-w-[80%] rounded-2xl px-3.5 py-2',
      isOwn
        ? 'bg-primary text-primary-foreground rounded-br-sm'
        : 'bg-muted rounded-bl-sm'
    )}>
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      <span className={cn(
        'text-[10px] mt-0.5 block',
        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
      </span>
    </div>
  </div>
));
ChatBubble.displayName = 'ChatBubble';

const SupportChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { messages, loading, sendMessage } = useCustomerSupportChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

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

  if (!user) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50">
      {/* Chat Window */}
      {open && (
        <div className="mb-3 w-[340px] sm:w-[380px] h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-page-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">VET-MEDIX Support</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />
                  Online
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef}>
            {loading ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-10 w-1/2 ml-auto" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">How can we help you?</p>
                <p className="text-xs mt-1">Send us a message and we'll respond shortly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => (
                  <ChatBubble key={msg.id} message={msg} isOwn={msg.sender_id === user.id} />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                maxLength={1000}
                className="flex-1 min-h-[44px] max-h-24 resize-none text-base md:text-sm"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-10 w-10 flex-shrink-0"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setOpen(prev => !prev)}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-xl transition-all duration-200",
          "bg-primary hover:bg-primary/90",
          open && "rotate-90"
        )}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
};

export default SupportChatWidget;
