import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Pause, Play, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { StoryGroup, Story } from '@/types/social';

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onViewed: (storyId: string) => void;
}

export const StoryViewer = ({ storyGroups, initialGroupIndex, onClose, onViewed }: StoryViewerProps) => {
  const navigate = useNavigate();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    if (!currentStory) return;

    // Mark as viewed
    if (!currentStory.viewed) {
      onViewed(currentStory.id);
    }

    // Start progress timer
    if (!isPaused) {
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          goToNext();
        } else {
          timerRef.current = setTimeout(updateProgress, 50);
        }
      };
      updateProgress();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStory?.id, isPaused]);

  const goToNext = () => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goToPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 z-10 text-white hover:bg-white/20 hidden sm:flex"
        onClick={goToPrev}
        disabled={groupIndex === 0 && storyIndex === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 z-10 text-white hover:bg-white/20 hidden sm:flex"
        onClick={goToNext}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Story container */}
      <div 
        className="relative w-full max-w-md h-full max-h-[90vh] bg-black rounded-lg overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            goToPrev();
          } else {
            goToNext();
          }
        }}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {currentGroup.stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < storyIndex ? '100%' : index === storyIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-3">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              navigate(`/pet/${currentGroup.pet.id}`);
            }}
          >
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={currentGroup.pet.avatar_url || ''} />
              <AvatarFallback>{currentGroup.pet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm">{currentGroup.pet.name}</p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Media */}
        {currentStory.media_type === 'video' ? (
          <video
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt=""
            className="w-full h-full object-contain"
            loading="eager"
            decoding="async"
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm">{currentStory.caption}</p>
          </div>
        )}

        {/* Views count */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 text-white/70">
          <Eye className="h-4 w-4" />
          <span className="text-xs">{currentStory.views_count}</span>
        </div>
      </div>
    </div>
  );
};
