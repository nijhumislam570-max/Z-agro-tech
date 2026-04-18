import { useState, useRef, useEffect, forwardRef } from 'react';
import { Image, Video, X, Loader2, ChevronDown, Check, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Pet } from '@/types/social';
import { 
  compressImage, 
  extractVideoPoster, 
  getCompressionMessage,
  type CompressedMedia 
} from '@/lib/mediaCompression';
import { sanitizeText, isTextSafe } from '@/lib/sanitize';

interface CreatePostCardProps {
  onPostCreated: () => void;
  defaultPetId?: string;
}

// File size limits (post-compression targets)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB (raw)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
const MAX_VIDEO_DURATION = 60; // 1 minute in seconds

export const CreatePostCard = forwardRef<HTMLDivElement, CreatePostCardProps>(({
  onPostCreated,
  defaultPetId
}, ref) => {
  const { user } = useAuth();
  const { activePet, pets } = usePets();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionStats, setCompressionStats] = useState<CompressedMedia[]>([]);
  
  // Revoke all object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track selected pet for this post (defaults to activePet or defaultPetId)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Sync selectedPet when activePet changes or on initial load
  useEffect(() => {
    if (!selectedPet) {
      // If defaultPetId is provided, find that pet first
      if (defaultPetId && pets.length > 0) {
        const defaultPet = pets.find(p => p.id === defaultPetId);
        if (defaultPet) {
          setSelectedPet(defaultPet as Pet);
          return;
        }
      }
      // Otherwise use activePet
      if (activePet) {
        setSelectedPet(activePet as Pet);
      }
    }
  }, [activePet, selectedPet, defaultPetId, pets]);

  const validateFile = async (file: File, type: 'image' | 'video'): Promise<boolean> => {
    if (type === 'image') {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`Image "${file.name}" exceeds 5MB limit`);
        return false;
      }
    } else {
      if (file.size > MAX_VIDEO_SIZE) {
        toast.error(`Video "${file.name}" exceeds 50MB limit`);
        return false;
      }

      // Check video duration
      return new Promise(resolve => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          if (video.duration > MAX_VIDEO_DURATION) {
            toast.error(`Video "${file.name}" exceeds 1 minute limit`);
            resolve(false);
          } else {
            resolve(true);
          }
        };
        video.onerror = () => {
          toast.error(`Could not validate video "${file.name}"`);
          resolve(false);
        };
        video.src = URL.createObjectURL(file);
      });
    }
    return true;
  };

  const handleFileSelect = (type: 'image' | 'video') => {
    if (!user) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }
    if (!selectedPet && !activePet) {
      toast.error('Please create a pet profile first');
      navigate('/pets/new');
      return;
    }
    setMediaType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.multiple = type === 'image';
      fileInputRef.current.click();
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // For videos, only allow 1 file
    if (mediaType === 'video' && files.length > 1) {
      toast.error('Only 1 video allowed per post');
      return;
    }

    // For images, limit to 4
    if (mediaType === 'image' && files.length + mediaFiles.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    // Validate files
    const validatedFiles: File[] = [];
    for (const file of files) {
      const isValid = await validateFile(file, mediaType);
      if (isValid) {
        validatedFiles.push(file);
      }
    }
    if (validatedFiles.length === 0) return;

    // Compress images
    if (mediaType === 'image') {
      setCompressing(true);
      setCompressionProgress(0);
      
      const compressedFiles: File[] = [];
      const stats: CompressedMedia[] = [];
      let totalOriginal = 0;
      let totalCompressed = 0;
      
      for (let i = 0; i < validatedFiles.length; i++) {
        const file = validatedFiles[i];
        setCompressionProgress(Math.round(((i + 0.5) / validatedFiles.length) * 100));
        
        try {
          const result = await compressImage(file, 'feed');
          compressedFiles.push(result.file);
          stats.push(result);
          totalOriginal += result.originalSize;
          totalCompressed += result.compressedSize;
        } catch {
          compressedFiles.push(file);
        }
        
        setCompressionProgress(Math.round(((i + 1) / validatedFiles.length) * 100));
      }
      
      setCompressing(false);
      setCompressionStats(stats);
      
      // Show compression summary
      if (totalOriginal > totalCompressed) {
        toast.success(getCompressionMessage(totalOriginal, totalCompressed));
      }
      
      const newFiles = [...mediaFiles, ...compressedFiles].slice(0, 4);
      setMediaFiles(newFiles);
      setIsExpanded(true);
      // Revoke old previews before creating new ones
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
      const previews = newFiles.map(file => URL.createObjectURL(file));
      setMediaPreviews(previews);
    } else {
      // Videos - extract poster but don't compress
      const newFiles = validatedFiles.slice(0, 1);
      setMediaFiles(newFiles);
      setIsExpanded(true);
      // Revoke old previews before creating new ones
      mediaPreviews.forEach(url => URL.revokeObjectURL(url));
      const previews = newFiles.map(file => URL.createObjectURL(file));
      setMediaPreviews(previews);
      
      // Extract video poster for faster preview
      extractVideoPoster(newFiles[0]).catch(() => {});
    }
  };

  const removeMedia = (index: number) => {
    // Revoke the blob URL before removing to prevent memory leak
    URL.revokeObjectURL(mediaPreviews[index]);
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
    setCompressionStats(compressionStats.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const petToPost = selectedPet || activePet;
    if (!user || !petToPost) return;
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Please add some content or media');
      return;
    }
    
    // Sanitize and validate content
    const sanitizedContent = sanitizeText(content, { maxLength: 1000 });
    if (!isTextSafe(sanitizedContent)) {
      toast.error('Post contains invalid content. Please remove any special characters.');
      return;
    }
    
    setSubmitting(true);
    try {
      const mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('pet-media').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('pet-media').getPublicUrl(fileName);
        mediaUrls.push(publicUrl);
      }
      const { error } = await supabase.from('posts').insert({
        pet_id: petToPost.id,
        user_id: user.id,
        content: content.trim() || null,
        media_urls: mediaUrls,
        media_type: mediaType
      });
      if (error) throw error;
      toast.success(`Post created as ${petToPost.name}!`);
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setIsExpanded(false);
      onPostCreated();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating post:', error);
      }
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (pets.length === 0) {
      navigate('/pets/new');
      return;
    }
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handlePetSelect = (pet: Pet) => {
    setSelectedPet(pet);
  };

  // Current pet to display (selectedPet or activePet fallback)
  const displayPet = selectedPet || activePet;

  if (!user) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border/50 p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">🐾</span>
          </div>
          <button 
            onClick={() => navigate('/auth')} 
            className="flex-1 h-9 sm:h-10 bg-muted hover:bg-muted/80 rounded-full px-3 sm:px-4 text-left text-muted-foreground text-xs sm:text-sm transition-colors truncate"
          >
            Join to share with pet lovers...
          </button>
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border/50 p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">🐶</span>
          </div>
          <button 
            onClick={() => navigate('/pets/new')} 
            className="flex-1 h-9 sm:h-10 bg-muted hover:bg-muted/80 rounded-full px-3 sm:px-4 text-left text-muted-foreground text-xs sm:text-sm transition-colors truncate"
          >
            Add your pet to start posting...
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 mb-3 sm:mb-4 overflow-hidden">
      {/* Composer Header */}
      <div className="p-3 sm:p-4 pb-2 sm:pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Pet Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 group flex-shrink-0">
                <div className="relative">
                  <Avatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                    <AvatarImage src={displayPet?.avatar_url || ''} alt={displayPet?.name} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {displayPet?.name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  {pets.length > 1 && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Post as ({pets.length} pet{pets.length !== 1 ? 's' : ''})
              </div>
              {pets.map((pet) => (
                <DropdownMenuItem
                  key={pet.id}
                  onClick={() => handlePetSelect(pet as Pet)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={pet.avatar_url || ''} alt={pet.name} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {pet.name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{pet.name}</p>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {pet.breed || pet.species}
                    </p>
                  </div>
                  {displayPet?.id === pet.id && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate('/pets/new')}
                className="flex items-center gap-2 cursor-pointer text-primary"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm">Add New Pet</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!isExpanded ? (
            <button 
              onClick={handleInputClick} 
              className="flex-1 h-9 sm:h-10 bg-muted hover:bg-muted/80 rounded-full px-3 sm:px-4 text-left text-muted-foreground text-xs sm:text-sm transition-colors truncate"
            >
              What's {displayPet?.name} up to?
            </button>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                Posting as {displayPet?.name}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                {displayPet?.breed || displayPet?.species} • Public
              </p>
            </div>
          )}
        </div>

        {/* Expanded Textarea */}
        {isExpanded && (
          <div className="mt-3">
            <textarea 
              ref={textareaRef} 
              placeholder={`What's on ${displayPet?.name}'s mind?`} 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className="w-full min-h-[80px] sm:min-h-[100px] resize-none border-0 bg-transparent text-foreground text-sm sm:text-base placeholder:text-muted-foreground/60 focus:outline-none" 
              maxLength={1000} 
            />
            
            {/* Compression Progress */}
            {compressing && (
              <div className="border border-border rounded-xl p-3 mt-2 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Optimizing images...</span>
                </div>
                <Progress value={compressionProgress} className="h-2" />
              </div>
            )}
            
            {/* Media Previews */}
            {!compressing && mediaPreviews.length > 0 && (
              <div className="border border-border rounded-xl p-2 mt-2 bg-muted/30">
                <div className={`grid gap-2 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden aspect-square">
                      {mediaType === 'video' ? (
                        <video src={preview} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={preview} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      )}
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-foreground/80 hover:bg-foreground text-background shadow-lg" 
                        onClick={() => removeMedia(index)}
                        disabled={compressing}
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      {/* Show compression badge */}
                      {compressionStats[index] && compressionStats[index].compressionRatio > 1 && (
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 bg-accent/90 text-accent-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                          {Math.round((1 - compressionStats[index].compressedSize / compressionStats[index].originalSize) * 100)}% smaller
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 text-center">
                  {mediaType === 'image' ? 'Auto-compressed for fast loading • Up to 4 images' : 'Max 50MB • 1 min duration'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t border-border/50 px-2 sm:px-4 py-2 bg-muted/20">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleFileSelect('image')} 
              disabled={submitting} 
              className="h-8 sm:h-9 gap-1 sm:gap-2 rounded-lg text-accent hover:bg-accent/10 hover:text-accent font-medium text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0"
            >
              <Image className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Photo</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleFileSelect('video')} 
              disabled={submitting} 
              className="h-8 sm:h-9 gap-1 sm:gap-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive font-medium text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0"
            >
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Video</span>
            </Button>
          </div>
          
          {isExpanded && (
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || compressing || (!content.trim() && mediaFiles.length === 0)} 
              size="sm" 
              className="h-8 sm:h-9 px-4 sm:px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs sm:text-sm flex-shrink-0"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : compressing ? 'Compressing...' : 'Post'}
            </Button>
          )}
        </div>
      </div>
      
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilesChange} />
    </div>
  );
});
CreatePostCard.displayName = 'CreatePostCard';