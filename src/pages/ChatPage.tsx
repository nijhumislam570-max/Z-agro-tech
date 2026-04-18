import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image, Loader2, Check, CheckCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import type { Pet } from '@/types/social';
import type { ConversationRow } from '@/types/database';

// Memoized message bubble component
const MessageBubble = memo(({ message, isOwn }: { message: any; isOwn: boolean }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`} role="listitem">
    <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
      {message.media_url && (
        <div className="mb-1">
          {message.media_type === 'video' ? (
            <video 
              src={message.media_url} 
              controls 
              className="rounded-lg max-h-60"
              aria-label="Video message"
            />
          ) : (
            <img 
              src={message.media_url} 
              alt="Shared media" 
              className="rounded-lg max-h-60 object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}
      {message.content && (
        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-primary text-primary-foreground rounded-br-sm' 
            : 'bg-muted rounded-bl-sm'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      )}
      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
        {isOwn && (
          message.is_read 
            ? <CheckCheck className="h-3 w-3 text-primary" aria-label="Message read" />
            : <Check className="h-3 w-3 text-muted-foreground" aria-label="Message sent" />
        )}
      </div>
    </div>
  </div>
));

MessageBubble.displayName = 'MessageBubble';

const ChatPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(conversationId || '');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherPet, setOtherPet] = useState<Pet | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch conversation details to get other user's pet
    const fetchConversation = async () => {
      if (!conversationId || !user) return;

      const { data: conv } = await supabase
        .from('conversations')
        .select('id, participant_1_id, participant_2_id, last_message_at, created_at')
        .eq('id', conversationId)
        .single();

      if (conv) {
        const typedConv = conv as ConversationRow;
        const otherUserId = typedConv.participant_1_id === user.id 
          ? typedConv.participant_2_id 
          : typedConv.participant_1_id;

        const { data: pets } = await supabase
          .from('pets')
          .select('*')
          .eq('user_id', otherUserId)
          .limit(1);

        if (pets?.[0]) {
          setOtherPet(pets[0] as Pet);
        }
      }
    };

    fetchConversation();
  }, [conversationId, user]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await sendMessage(newMessage);
    setNewMessage('');
    setSending(false);
  }, [newMessage, sending, sendMessage]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    await sendMessage('', file);
    setSending(false);
    e.target.value = '';
  }, [sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleBackClick = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  const handlePetProfileClick = useCallback(() => {
    if (otherPet) {
      navigate(`/pet/${otherPet.id}`);
    }
  }, [navigate, otherPet]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b bg-card">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBackClick}
          aria-label="Go back to messages"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        {otherPet && (
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={handlePetProfileClick}
            role="button"
            aria-label={`View ${otherPet.name}'s profile`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handlePetProfileClick()}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherPet.avatar_url || ''} alt={`${otherPet.name}'s avatar`} />
              <AvatarFallback aria-hidden="true">{otherPet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{otherPet.name}</p>
              <p className="text-xs text-muted-foreground">{otherPet.species}</p>
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex justify-center py-8" aria-busy="true" aria-label="Loading messages">
            <Loader2 className="h-6 w-6 animate-spin text-primary transform-gpu" aria-hidden="true" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" role="status">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Chat messages">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isOwn={message.sender_id === user.id} 
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleImageButtonClick}
            disabled={sending}
            aria-label="Send image or video"
          >
            <Image className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
            maxLength={1000}
            className="flex-1 min-h-[44px] max-h-32 resize-none text-base"
            rows={1}
            aria-label="Message input. Press Enter to send, Shift+Enter for new line."
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending}
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin transform-gpu" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  );
};

export default ChatPage;
