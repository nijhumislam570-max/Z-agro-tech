import { useState, memo, forwardRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Globe, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CommentsSection } from './CommentsSection';
import { LazyImage, LazyVideo } from './LazyMedia';
import type { Post } from '@/types/social';
import { removeStorageFiles } from '@/lib/storageUtils';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onDelete?: () => void;
  onCommentCountChange?: (postId: string, delta: number) => void;
}

const PostCardComponent = forwardRef<HTMLDivElement, PostCardProps>(({ post, onLike, onUnlike, onDelete, onCommentCountChange }, ref) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like posts');
      navigate('/auth');
      return;
    }
    // Debounce guard: block rapid double-taps
    if (isLiking) return;
    setIsLiking(true);
    setTimeout(() => setIsLiking(false), 500);
    
    if (post.liked_by_user) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleDelete = async () => {
    if (!user || post.user_id !== user.id) return;
    
    setDeleting(true);
    try {
      // Clean up storage files before deleting the post row
      if (post.media_urls && post.media_urls.length > 0) {
        await removeStorageFiles(post.media_urls);
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      toast.success('Post deleted');
      onDelete?.();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    // L-1 Fix: point share URL to the pet profile which actually exists,
    // instead of /post/:id which has no route defined in App.tsx.
    const shareUrl = `${window.location.origin}/pet/${post.pet_id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.pet?.name}'s post`,
          text: post.content || `Check out ${post.pet?.name}'s post!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    }
  };

  const contentLimit = 200;
  const hasLongContent = post.content && post.content.length > contentLimit;
  const displayContent = hasLongContent && !showFullContent 
    ? post.content?.slice(0, contentLimit) + '...' 
    : post.content;

  return (
    <div ref={ref}>
    <article className="bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 sm:p-4 pb-2 sm:pb-3">
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 flex-1"
          onClick={() => navigate(`/pet/${post.pet_id}`)}
        >
          <Avatar className="h-9 w-9 sm:h-11 sm:w-11 ring-2 ring-primary/10 flex-shrink-0">
            <AvatarImage src={post.pet?.avatar_url || ''} alt={post.pet?.name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
              {post.pet?.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-[15px] text-foreground hover:underline leading-tight truncate">
              {post.pet?.name}
            </h3>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <span className="truncate">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              <span>·</span>
              <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
            </div>
          </div>
        </div>
        
        {user?.id === post.user_id && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted flex-shrink-0 ml-2">
                  <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 sm:w-44 shadow-lg rounded-xl">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs sm:text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-3 sm:px-4 pb-2 sm:pb-3">
          <p className="text-sm sm:text-[15px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {displayContent}
          </p>
          {hasLongContent && (
            <button 
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-primary font-medium text-xs sm:text-sm mt-1 hover:underline"
            >
              {showFullContent ? 'See less' : 'See more'}
            </button>
          )}
        </div>
      )}
      
      {/* Media - Facebook-style: full-width, natural aspect ratio, max-height crop */}
      {post.media_urls && post.media_urls.length > 0 && (
        <>
          {post.media_urls.length === 1 ? (
            /* Single media: Facebook-style — full width, natural ratio, center-crop at max-height */
            post.media_type === 'video' ? (
              <div className="w-full max-h-[500px] sm:max-h-[600px] overflow-hidden bg-muted">
                <LazyVideo 
                  src={post.media_urls[0]} 
                  className="w-full h-[500px] sm:h-[600px]"
                />
              </div>
            ) : (
              <div className="w-full max-h-[600px] sm:max-h-[700px] overflow-hidden">
                <LazyImage 
                  src={post.media_urls[0]} 
                  alt={`${post.pet?.name}'s photo`}
                />
              </div>
            )
          ) : (
            /* Multi media: grid with aspect-square crops */
            <div 
              className="grid grid-cols-2 gap-[1px] sm:gap-0.5 bg-border/30"
              style={{ contentVisibility: 'auto', containIntrinsicSize: '0 300px' }}
            >
              {post.media_urls.slice(0, 4).map((url, index) => (
                <div 
                  key={index} 
                  className={`relative overflow-hidden bg-muted ${
                    post.media_urls.length === 3 && index === 0 ? 'row-span-2' : ''
                  } aspect-square`}
                >
                  {post.media_type === 'video' ? (
                    <LazyVideo src={url} className="w-full h-full" />
                  ) : (
                    <LazyImage src={url} alt={`${post.pet?.name}'s photo`} fill />
                  )}
                  {index === 3 && post.media_urls.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer backdrop-blur-sm">
                      <span className="text-white text-xl sm:text-2xl font-bold">
                        +{post.media_urls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Instagram-style Action Buttons */}
      <div className="px-3 sm:px-4 pt-2 sm:pt-3">
        <div className="flex items-center justify-between">
          {/* Left actions: Like, Comment, Share - with proper touch targets */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={handleLike}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:opacity-60 transition-opacity active:scale-90"
              aria-label={post.liked_by_user ? 'Unlike' : 'Like'}
            >
              <Heart className={`h-6 w-6 sm:h-7 sm:w-7 transition-all duration-200 ${
                post.liked_by_user 
                  ? 'fill-rose-500 text-rose-500' 
                  : 'text-foreground'
              } ${isLiking ? 'scale-125' : ''}`} />
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:opacity-60 transition-opacity active:scale-90"
              aria-label="Comment"
            >
              <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-foreground" />
            </button>
            
            <button 
              onClick={handleShare}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:opacity-60 transition-opacity active:scale-90"
              aria-label="Share"
            >
              <Send className="h-5 w-5 sm:h-6 sm:w-6 text-foreground -rotate-12" />
            </button>
          </div>
          
          {/* H-4 Fix: Bookmark button removed — it was local-only state with no
              database persistence, creating false user expectations. Will be
              re-added once a saved_posts table is implemented. */}
        </div>
        
        {/* Likes count - Instagram style */}
        {post.likes_count > 0 && (
          <p className="font-semibold text-sm sm:text-[15px] mt-2 sm:mt-3 text-foreground">
            {post.likes_count.toLocaleString()} {post.likes_count === 1 ? 'like' : 'likes'}
          </p>
        )}
        
        {/* Comments count - Instagram style */}
        {post.comments_count > 0 && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="text-muted-foreground text-sm sm:text-[15px] mt-1 hover:text-foreground transition-colors"
          >
            View all {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
          </button>
        )}
        
        {/* Timestamp */}
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-2 pb-3">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: false })} ago
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border/50 bg-muted/30 p-3 sm:p-4">
          <CommentsSection postId={post.id} onCommentCountChange={(delta) => onCommentCountChange?.(post.id, delta)} />
        </div>
      )}
    </article>
    </div>
  );
});

// Memoize the PostCard to prevent unnecessary re-renders
const MemoizedPostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.comments_count === nextProps.post.comments_count &&
    prevProps.post.liked_by_user === nextProps.post.liked_by_user
  );
});
MemoizedPostCard.displayName = 'PostCard';

export { MemoizedPostCard as PostCard };
