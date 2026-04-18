import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { Pet } from '@/types/social';
import type { PetFollowData } from '@/hooks/useExplorePets';

const speciesEmojis: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐱',
  Bird: '🐦',
  Fish: '🐠',
  Rabbit: '🐰',
  Hamster: '🐹',
  Other: '🐾',
};

interface ExplorePetCardProps {
  pet: Pet;
  followData: PetFollowData;
  onFollow: (petId: string) => void;
  onUnfollow: (petId: string) => void;
}

const ExplorePetCard = memo(({ pet, followData, onFollow, onUnfollow }: ExplorePetCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === pet.user_id;

  const handleFollowClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (followData.isFollowing) {
      onUnfollow(pet.id);
    } else {
      onFollow(pet.id);
    }
  }, [user, followData.isFollowing, onUnfollow, onFollow, navigate, pet.id]);

  const handleCardClick = useCallback(() => {
    navigate(`/pet/${pet.id}`);
  }, [navigate, pet.id]);

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 bg-card transform-gpu"
      onClick={handleCardClick}
      role="article"
      aria-label={`${pet.name}'s profile card`}
    >
      {/* Cover Photo Section */}
      <div className="relative h-28 sm:h-32 md:h-36 overflow-hidden">
        {pet.cover_photo_url ? (
          <OptimizedImage
            src={pet.cover_photo_url}
            alt=""
            preset="thumbnail"
            width={400}
            height={144}
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/40" aria-hidden="true">
            <div className="absolute inset-0 paw-pattern opacity-30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
          <Badge className="bg-card/95 backdrop-blur-sm text-foreground border-0 shadow-md text-xs font-medium px-2.5 py-1">
            {speciesEmojis[pet.species] || '🐾'} {pet.species}
          </Badge>
        </div>

        <div className="absolute -bottom-10 sm:-bottom-12 left-3 sm:left-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary via-accent to-primary opacity-75 blur-sm" />
            <div className="relative rounded-full p-[3px] bg-gradient-to-br from-primary to-accent">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-[3px] border-card shadow-lg">
                <AvatarImage
                  src={pet.avatar_url || ''}
                  alt={pet.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-2xl sm:text-3xl font-bold text-primary">
                  {pet.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="pt-12 sm:pt-14 pb-4 px-3 sm:px-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base sm:text-lg truncate group-hover:text-primary transition-colors">
              {pet.name}
            </h3>
            {pet.breed && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{pet.breed}</p>
            )}
          </div>
          {!isOwner && (
            <Button
              variant={followData.isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={handleFollowClick}
              className={`shrink-0 h-8 sm:h-9 text-xs sm:text-sm px-3 ${
                followData.isFollowing
                  ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              {followData.isFollowing ? (
                <>
                  <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 fill-current" />
                  <span className="hidden xs:inline">Following</span>
                  <span className="xs:hidden">✓</span>
                </>
              ) : (
                <>
                  <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mb-2.5">
          <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
            <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="font-medium">{followData.followersCount}</span>
          </span>
          {pet.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-primary/70" />
              <span className="truncate">{pet.location}</span>
            </span>
          )}
        </div>

        {pet.bio && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {pet.bio}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

ExplorePetCard.displayName = 'ExplorePetCard';

export default ExplorePetCard;
