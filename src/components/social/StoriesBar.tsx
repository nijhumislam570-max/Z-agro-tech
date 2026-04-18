import { useState, useRef } from 'react';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { useStories } from '@/hooks/useStories';
import { StoryViewer } from './StoryViewer';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { StoryGroup } from '@/types/social';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';

export const StoriesBar = () => {
  const { user } = useAuth();
  const { activePet, pets } = usePets();
  const { storyGroups, createStory, markAsViewed, refresh } = useStories();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialGroupIndex, setInitialGroupIndex] = useState(0);

  const handleAddStory = () => {
    if (!user) {
      toast.error('Please login to add stories');
      navigate('/auth');
      return;
    }
    if (!activePet) {
      toast.error('Please create a pet profile first');
      navigate('/pets/new');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePet) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast.error('Please select an image or video');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);

    // Compress images before upload
    let fileToUpload = file;
    if (isImage) {
      try {
        const compressed = await compressImage(file, 'feed');
        fileToUpload = compressed.file;
        if (compressed.compressionRatio > 1) {
          toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
        }
      } catch {
        // If compression fails, upload raw
      }
    }

    const result = await createStory(activePet.id, fileToUpload);
    setUploading(false);

    if (result) {
      toast.success('Story added! ✨');
    } else {
      toast.error('Failed to add story');
    }

    e.target.value = '';
  };

  const openViewer = (index: number) => {
    setInitialGroupIndex(index);
    setViewerOpen(true);
  };

  const userHasStory = activePet && storyGroups.some(g => g.pet.id === activePet.id);

  return (
    <>
      <div className="relative">
        {/* Decorative gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="flex gap-4 overflow-x-auto py-4 px-1 scrollbar-hide scroll-smooth">
          {/* Add Story Button */}
          {user && pets.length > 0 && (
            <div className="flex flex-col items-center gap-2 flex-shrink-0 group">
              <button
                onClick={handleAddStory}
                disabled={uploading}
                className="relative transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <div className={`p-[3px] rounded-full ${
                  userHasStory 
                    ? 'bg-gradient-to-br from-primary via-sunshine to-accent' 
                    : 'bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/20'
                }`}>
                  <Avatar className="h-16 w-16 sm:h-[72px] sm:w-[72px] border-[3px] border-card">
                    <AvatarImage src={activePet?.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-lg">
                      {activePet?.name?.charAt(0) || '+'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-gradient-to-br from-primary to-coral-dark rounded-full flex items-center justify-center border-[3px] border-card shadow-button transform transition-transform group-hover:scale-110">
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </div>
              </button>
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors truncate w-16 text-center">
                Add Story
              </span>
            </div>
          )}

          {/* Story Groups */}
          {storyGroups.map((group, index) => (
            <div 
              key={group.pet.id} 
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
              onClick={() => openViewer(index)}
            >
              <div className="transform transition-all duration-300 hover:scale-105 active:scale-95">
                <div className={`p-[3px] rounded-full transition-all ${
                  group.hasUnviewed 
                    ? 'bg-gradient-to-br from-primary via-sunshine to-accent shadow-glow animate-pulse-slow' 
                    : 'bg-muted-foreground/30'
                }`}>
                  <Avatar className="h-16 w-16 sm:h-[72px] sm:w-[72px] border-[3px] border-card">
                    <AvatarImage src={group.pet.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 font-bold text-lg">
                      {group.pet.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                {group.hasUnviewed && (
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-4 w-4 text-sunshine animate-bounce-gentle" />
                  </div>
                )}
              </div>
              <span className={`text-xs font-semibold truncate w-16 text-center transition-colors ${
                group.hasUnviewed ? 'text-foreground' : 'text-muted-foreground'
              } group-hover:text-foreground`}>
                {group.pet.name}
              </span>
            </div>
          ))}

          {storyGroups.length === 0 && !user && (
            <div className="flex items-center gap-3 py-4 px-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl">
              <span className="text-2xl">✨</span>
              <p className="text-muted-foreground text-sm font-medium">
                Login to see stories from pets you follow
              </p>
            </div>
          )}
          
          {storyGroups.length === 0 && user && pets.length > 0 && (
            <div className="flex items-center gap-3 py-4 px-4 bg-gradient-to-r from-accent/5 to-lavender/5 rounded-2xl">
              <span className="text-2xl animate-bounce-gentle">🐾</span>
              <p className="text-muted-foreground text-sm font-medium">
                Follow more pets to see their stories!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && storyGroups.length > 0 && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={initialGroupIndex}
          onClose={() => {
            setViewerOpen(false);
            refresh();
          }}
          onViewed={markAsViewed}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};