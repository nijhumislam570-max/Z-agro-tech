import { useState } from 'react';
import { Send, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { useComments } from '@/hooks/useComments';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CommentsSectionProps {
  postId: string;
  onCommentCountChange?: (delta: number) => void;
}

export const CommentsSection = ({ postId, onCommentCountChange }: CommentsSectionProps) => {
  const { user } = useAuth();
  const { activePet } = usePets();
  const { comments, loading, addComment, deleteComment } = useComments(postId);
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      navigate('/auth');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const result = await addComment(newComment.trim(), activePet?.id);
    if (result?.success === false && result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      onCommentCountChange?.(1);
    }
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      {/* New comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-1 ring-border flex-shrink-0">
          <AvatarImage src={activePet?.avatar_url || ''} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold">
            {activePet?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={user ? "Write a comment..." : "Login to comment"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || submitting}
            maxLength={500}
            className="w-full h-8 sm:h-9 bg-muted rounded-full px-3 sm:px-4 pr-9 sm:pr-10 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          {newComment.trim() && (
            <Button 
              type="submit" 
              size="icon"
              variant="ghost"
              disabled={!user || submitting}
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full text-primary hover:bg-primary/10 min-h-[44px] min-w-[44px]"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
        {loading ? (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 group">
              <Avatar 
                className="h-7 w-7 sm:h-8 sm:w-8 ring-1 ring-border cursor-pointer flex-shrink-0"
                onClick={() => comment.pet_id && navigate(`/pet/${comment.pet_id}`)}
              >
                <AvatarImage src={comment.pet?.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="bg-muted text-[10px] sm:text-xs font-semibold">
                  {comment.pet?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="inline-block bg-muted rounded-2xl px-2.5 sm:px-3 py-1.5 sm:py-2 max-w-full">
                  <span 
                    className="text-[11px] sm:text-[13px] font-semibold text-foreground hover:underline cursor-pointer block truncate"
                    onClick={() => comment.pet_id && navigate(`/pet/${comment.pet_id}`)}
                  >
                    {comment.pet?.name || 'Anonymous'}
                  </span>
                  <p className="text-xs sm:text-[15px] text-foreground break-words">{comment.content}</p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 px-2 sm:px-3">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  <button 
                    onClick={() => toast.info('Comment likes coming soon!', { duration: 2000 })}
                    className="text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-destructive hover:underline transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Like comment"
                  >
                    Like
                  </button>
                  <button 
                    onClick={() => toast.info('Replies coming soon!', { duration: 2000 })}
                    className="text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-primary hover:underline transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Reply to comment"
                  >
                    Reply
                  </button>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => { deleteComment(comment.id); onCommentCountChange?.(-1); }}
                      className="text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Delete comment"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};