import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Shield, PawPrint, ShoppingBag, Building2, Calendar, LogOut, Star, MapPin, Plus, Bell, Settings, Heart, Share2, Stethoscope } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';
import { removeStorageFiles } from '@/lib/storageUtils';

interface ProfileHeaderProps {
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
  profile: {
    full_name: string | null;
    avatar_url?: string | null;
    cover_photo_url?: string | null;
    address?: string | null;
    division?: string | null;
  } | null;
  petsCount: number;
  ordersCount: number;
  appointmentsCount: number;
  isAdmin: boolean;
  isClinicOwner: boolean;
  isDoctor?: boolean;
  onAvatarUpdate: (url: string) => void;
  onCoverUpdate?: (url: string) => void;
}

const ProfileHeader = ({ 
  user, 
  profile, 
  petsCount, 
  ordersCount, 
  appointmentsCount,
  isAdmin, 
  isClinicOwner,
  isDoctor,
  onAvatarUpdate,
  onCoverUpdate 
}: ProfileHeaderProps) => {
  
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitials = (name: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Max 20MB allowed");
      return;
    }

    // Show optimistic preview immediately
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      // Clean up old avatar
      if (profile?.avatar_url) {
        await removeStorageFiles([profile.avatar_url], 'avatars');
      }

      const compressed = await compressImage(file, 'avatar');
      if (compressed.compressionRatio > 1) {
        toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
      }

      const fileExt = compressed.file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed.file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      setAvatarPreview(null);
      toast.success("Profile picture updated!");
    } catch (error: unknown) {
      setAvatarPreview(null);
      toast.error("Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Max 20MB allowed");
      return;
    }

    // Show optimistic preview immediately
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      // Clean up old cover
      if (profile?.cover_photo_url) {
        await removeStorageFiles([profile.cover_photo_url], 'avatars');
      }

      const compressed = await compressImage(file, 'feed');
      if (compressed.compressionRatio > 1) {
        toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
      }

      const fileExt = compressed.file.name.split('.').pop();
      const filePath = `${user.id}/cover-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed.file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onCoverUpdate?.(publicUrl);
      setCoverPreview(null);
      toast.success("Cover photo updated!");
    } catch (error: unknown) {
      setCoverPreview(null);
      toast.error("Upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied!");
  };

  return (
    <div className="bg-card shadow-sm rounded-none sm:rounded-2xl overflow-hidden mb-4 sm:mb-6">
      {/* Hero Cover Photo Section */}
      <div className="relative h-[160px] xs:h-[200px] sm:h-[260px] md:h-[320px] lg:h-[360px] overflow-hidden">
        {(coverPreview || profile?.cover_photo_url) ? (
          <img 
            src={coverPreview || profile?.cover_photo_url || ''} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          /* Animated Gradient Hero Background */
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-lavender animate-gradient-slow">
            {/* Animated floating elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[10%] left-[5%] w-20 h-20 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl animate-float" />
              <div className="absolute top-[30%] right-[10%] w-24 h-24 sm:w-40 sm:h-40 bg-white/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-[20%] left-[20%] w-16 h-16 sm:w-28 sm:h-28 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-[10%] right-[25%] w-12 h-12 sm:w-20 sm:h-20 bg-white/20 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }} />
              
              {/* Decorative paw prints */}
              <div className="absolute top-[15%] right-[15%] text-4xl sm:text-6xl opacity-20 animate-float">🐾</div>
              <div className="absolute bottom-[25%] left-[10%] text-3xl sm:text-5xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>🐾</div>
              <div className="absolute top-[50%] left-[40%] text-2xl sm:text-4xl opacity-10 animate-float" style={{ animationDelay: '2.5s' }}>✨</div>
            </div>
            
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        )}
        
        {/* Cover Photo Overlay Gradient */}
        {profile?.cover_photo_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        )}
        
        {/* Edit Cover Button */}
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
              <span className="hidden sm:inline">{profile?.cover_photo_url ? 'Change cover' : 'Add cover photo'}</span>
              <span className="sm:hidden">Cover</span>
            </>
          )}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-5 sm:pb-6">
        {/* Avatar - Overlapping Cover */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
          <div className="relative -mt-[55px] xs:-mt-[65px] sm:-mt-[75px] md:-mt-[85px] self-center sm:self-start z-10">
            <div className="p-1 bg-card rounded-full shadow-xl ring-4 ring-card">
              <Avatar className="h-[90px] w-[90px] xs:h-[110px] xs:w-[110px] sm:h-[130px] sm:w-[130px] md:h-[150px] md:w-[150px]">
                <AvatarImage src={avatarPreview || profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} className="object-cover" />
                <AvatarFallback className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {getInitials(profile?.full_name || null, user.email)}
                </AvatarFallback>
              </Avatar>
            </div>
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
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Name & Info */}
          <div className="flex-1 text-center sm:text-left min-w-0 pt-2 sm:pt-0 sm:pb-1">
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {profile?.full_name || 'Pet Parent'}
            </h1>
            
            {/* Role Badges */}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-2 flex-wrap">
              {isAdmin && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {isDoctor && (
                <Badge className="bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100 text-xs">
                  <Stethoscope className="h-3 w-3 mr-1" />
                  Veterinary Doctor
                </Badge>
              )}
              {isClinicOwner && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Clinic Owner
                </Badge>
              )}
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs">
                <Star className="h-3 w-3 mr-1 fill-amber-500" />
                Pet Parent
              </Badge>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {user.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'recently'}
              </span>
              {profile?.division && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.division}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5 text-coral" />
                {petsCount} {petsCount === 1 ? 'pet' : 'pets'}
              </span>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 pb-1">
            <Link to="/pets/new">
              <Button className="gap-2 font-semibold shadow-sm">
                <Plus className="h-4 w-4" />
                Add Pet
              </Button>
            </Link>
            <Button variant="secondary" size="icon" onClick={handleShareProfile} title="Share profile">
              <Share2 className="h-4 w-4" />
            </Button>
            <Link to="/notifications">
              <Button variant="secondary" size="icon" title="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="icon" title="Admin Panel">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {isDoctor && (
              <Link to="/doctor/dashboard">
                <Button variant="outline" size="icon" title="Doctor Dashboard">
                  <Stethoscope className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {(isClinicOwner || isAdmin) && (
              <Link to="/clinic/dashboard">
                <Button variant="outline" size="icon" title="Clinic Dashboard">
                  <Building2 className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out" className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-4 sm:hidden">
          <Link to="/pets/new" className="col-span-2">
            <Button className="w-full gap-2 font-semibold h-10 shadow-sm">
              <Plus className="h-4 w-4" />
              Add Pet
            </Button>
          </Link>
          <Button variant="secondary" onClick={handleShareProfile} className="h-10">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={handleSignOut} className="h-10 text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Links for Admin/Clinic Owner - Mobile */}
        {(isAdmin || isClinicOwner || isDoctor) && (
          <div className="flex gap-2 mt-2 sm:hidden flex-wrap">
            {isAdmin && (
              <Link to="/admin" className="flex-1 min-w-[120px]">
                <Button variant="outline" className="w-full gap-2 h-9 text-xs">
                  <Shield className="h-3.5 w-3.5" />
                  Admin Panel
                </Button>
              </Link>
            )}
            {isDoctor && (
              <Link to="/doctor/dashboard" className="flex-1 min-w-[120px]">
                <Button variant="outline" className="w-full gap-2 h-9 text-xs">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Doctor Dashboard
                </Button>
              </Link>
            )}
            {(isClinicOwner || isAdmin) && (
              <Link to="/clinic/dashboard" className="flex-1 min-w-[120px]">
                <Button variant="outline" className="w-full gap-2 h-9 text-xs">
                  <Building2 className="h-3.5 w-3.5" />
                  Clinic Dashboard
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border/50 mt-4 sm:mt-5" />

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-1 sm:gap-3 mt-4">
          <Link to="/profile?tab=pets" className="group">
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer active:scale-95">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <PawPrint className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-foreground">{petsCount}</span>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">My Pets</span>
            </div>
          </Link>
          <Link to="/profile?tab=orders" className="group">
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-coral/5 transition-colors cursor-pointer active:scale-95">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-coral/20 to-coral/5 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ShoppingBag className="h-5 w-5 sm:h-7 sm:w-7 text-coral" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-foreground">{ordersCount}</span>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Orders</span>
            </div>
          </Link>
          <Link to="/profile?tab=appointments" className="group">
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl hover:bg-accent/5 transition-colors cursor-pointer active:scale-95">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5 sm:h-7 sm:w-7 text-accent" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-foreground">{appointmentsCount}</span>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">Appointments</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
