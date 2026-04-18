import { useState, useRef } from 'react';
import { Camera, MapPin, MessageCircle, Heart, Users, Edit2, Loader2, Grid3X3, UserPlus, MoreHorizontal, Share2, Verified, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Pet } from '@/types/social';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';

interface PetProfileCardProps {
  pet: Pet;
  postsCount: number;
  isOwner: boolean;
  onPetUpdate?: (updatedPet: Pet) => void;
}

export const PetProfileCard = ({ pet, postsCount, isOwner, onPetUpdate }: PetProfileCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, followersCount, followingCount, follow, unfollow } = useFollow(pet.id);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleFollowToggle = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  const handleMessage = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${pet.user_id}),and(participant_1_id.eq.${pet.user_id},participant_2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConvo) {
        navigate(`/chat/${existingConvo.id}`);
        return;
      }

      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user.id,
          participant_2_id: pet.user_id,
        })
        .select('id')
        .single();

      if (error) throw error;
      navigate(`/chat/${newConvo.id}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error starting conversation:', error);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be less than 20MB');
      return;
    }

    setUploadingCover(true);
    try {
      // Compress image before upload
      const compressed = await compressImage(file, 'feed');
      
      if (compressed.compressionRatio > 1) {
        toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
      }

      const fileExt = compressed.file.name.split('.').pop();
      const fileName = `${user.id}/covers/${pet.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-media')
        .upload(fileName, compressed.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-media')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('pets')
        .update({ cover_photo_url: publicUrl })
        .eq('id', pet.id);

      if (updateError) throw updateError;

      onPetUpdate?.({ ...pet, cover_photo_url: publicUrl });
      toast.success('Cover photo updated!');
    } catch (error) {
      toast.error('Failed to update cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be less than 20MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Compress image before upload
      const compressed = await compressImage(file, 'avatar');
      
      if (compressed.compressionRatio > 1) {
        toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
      }

      const fileExt = compressed.file.name.split('.').pop();
      const fileName = `${user.id}/avatars/${pet.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-media')
        .upload(fileName, compressed.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-media')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('pets')
        .update({ avatar_url: publicUrl })
        .eq('id', pet.id);

      if (updateError) throw updateError;

      onPetUpdate?.({ ...pet, avatar_url: publicUrl });
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error('Failed to update profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  const handleReportProfile = () => {
    toast.info('Report feature coming soon');
  };

  return (
    <div className="bg-card shadow-sm rounded-none sm:rounded-2xl overflow-hidden">
      {/* Hero Cover Photo Section */}
      <div className="relative h-[160px] xs:h-[200px] sm:h-[260px] md:h-[320px] lg:h-[360px] overflow-hidden">
        {pet.cover_photo_url ? (
          <img 
            src={pet.cover_photo_url} 
            alt="" 
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          /* Animated Gradient Hero Background */
          <div className="absolute inset-0 bg-gradient-to-br from-lavender via-sky to-mint animate-gradient-slow">
            {/* Animated floating elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[10%] left-[5%] w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl animate-float" />
              <div className="absolute top-[30%] right-[10%] w-24 h-24 sm:w-40 sm:h-40 bg-white/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-[20%] left-[20%] w-16 h-16 sm:w-28 sm:h-28 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-[10%] right-[25%] w-12 h-12 sm:w-20 sm:h-20 bg-white/20 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }} />
              
              {/* Decorative elements */}
              <div className="absolute top-[15%] right-[15%] text-4xl sm:text-6xl opacity-20 animate-float">🐾</div>
              <div className="absolute bottom-[25%] left-[10%] text-3xl sm:text-5xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>💖</div>
              <div className="absolute top-[50%] left-[40%] text-2xl sm:text-4xl opacity-10 animate-float" style={{ animationDelay: '2.5s' }}>✨</div>
              <div className="absolute bottom-[15%] right-[15%] text-2xl sm:text-3xl opacity-15 animate-float" style={{ animationDelay: '0.5s' }}>🌟</div>
            </div>
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        )}
        
        {/* Cover Photo Overlay */}
        {pet.cover_photo_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        )}
        
        {/* Edit Cover Button */}
        {isOwner && (
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-black/50 hover:bg-black/70 text-white text-xs sm:text-sm font-medium rounded-lg backdrop-blur-sm transition-all"
          >
            {uploadingCover ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">{pet.cover_photo_url ? 'Change cover' : 'Add cover photo'}</span>
                <span className="sm:hidden">Cover</span>
              </>
            )}
          </button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
          <div className="relative -mt-[55px] xs:-mt-[65px] sm:-mt-[75px] md:-mt-[85px] self-center sm:self-start z-10">
            <div className="p-1 bg-card rounded-full shadow-xl ring-4 ring-card">
              <Avatar className="h-[90px] w-[90px] xs:h-[110px] xs:w-[110px] sm:h-[130px] sm:w-[130px] md:h-[150px] md:w-[150px]">
                <AvatarImage src={pet.avatar_url || ''} alt={pet.name} className="object-cover" />
                <AvatarFallback className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-bold">
                  {pet.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwner && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg transition-colors"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </>
            )}
          </div>

          {/* Name & Info */}
          <div className="flex-1 text-center sm:text-left min-w-0 pt-2 sm:pt-0 sm:pb-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight truncate">
                {pet.name}
              </h1>
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-sunshine flex-shrink-0" />
            </div>
            
            {/* Species & Breed Badges */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-2 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-xs font-medium">
                {pet.species}
              </Badge>
              {pet.breed && (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  {pet.breed}
                </Badge>
              )}
              {pet.age && (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  {pet.age}
                </Badge>
              )}
            </div>

            {/* Followers Info */}
            <div className="flex items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{followersCount}</span> followers
              </span>
              <span>
                <span className="font-semibold text-foreground">{followingCount}</span> following
              </span>
              <span>
                <span className="font-semibold text-foreground">{postsCount}</span> posts
              </span>
            </div>
            
            {/* Location */}
            {pet.location && (
              <p className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{pet.location}</span>
              </p>
            )}
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 pb-1">
            {isOwner ? (
              <>
                <Button 
                  onClick={() => navigate(`/pets/${pet.id}/edit`)}
                  className="gap-2 font-semibold shadow-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Profile
                </Button>
                <Button variant="secondary" size="icon" onClick={handleShareProfile} title="Share profile">
                  <Share2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant={isFollowing ? 'secondary' : 'default'}
                  onClick={handleFollowToggle}
                  className="gap-2 font-semibold min-w-[120px] shadow-sm"
                >
                  {isFollowing ? (
                    <>
                      <Heart className="h-4 w-4 fill-current" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handleMessage}
                  className="gap-2 font-semibold"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleShareProfile}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleReportProfile} className="text-destructive">
                      Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {pet.bio && (
          <p className="mt-4 text-sm sm:text-base text-muted-foreground text-center sm:text-left leading-relaxed">
            {pet.bio}
          </p>
        )}

        {/* Mobile Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-4 sm:hidden">
          {isOwner ? (
            <>
              <Button 
                onClick={() => navigate(`/pets/${pet.id}/edit`)}
                className="col-span-3 gap-2 font-semibold h-10 shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button variant="secondary" onClick={handleShareProfile} className="h-10">
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant={isFollowing ? 'secondary' : 'default'}
                onClick={handleFollowToggle}
                className="col-span-2 gap-2 font-semibold h-10 shadow-sm"
              >
                {isFollowing ? (
                  <>
                    <Heart className="h-4 w-4 fill-current" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
              <Button 
                variant="secondary"
                onClick={handleMessage}
                className="h-10"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShareProfile}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReportProfile} className="text-destructive">
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mt-4 sm:mt-5" />

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-1 sm:gap-3 mt-4">
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer">
            <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2">
              <Grid3X3 className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground">{postsCount}</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Posts</span>
          </div>
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-coral/5 transition-colors cursor-pointer">
            <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-coral/20 to-coral/5 flex items-center justify-center mb-2">
              <Users className="h-5 w-5 sm:h-7 sm:w-7 text-coral" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground">{followersCount}</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Followers</span>
          </div>
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-accent/5 transition-colors cursor-pointer">
            <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-2">
              <Heart className="h-5 w-5 sm:h-7 sm:w-7 text-accent" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground">{followingCount}</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Following</span>
          </div>
        </div>
      </div>
    </div>
  );
};
