import { useState, useEffect, useRef, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { 
  Save, Loader2, Camera, Building2, MapPin, 
  Phone, Mail, Clock, CheckCircle, ChevronLeft,
  Image as ImageIcon, Sparkles, X, Upload, Trash2,
  Shield, FileText, User, CreditCard, ExternalLink, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';
import { getSignedUrl, validateImageFile } from '@/lib/storageUtils';
import { getDivisions, getDistricts, getThanas } from '@/lib/bangladeshRegions';

const serviceCategories = [
  'General Checkup',
  'Vaccination',
  'Surgery',
  'Dental Care',
  'Grooming',
  'Emergency Care',
  'X-Ray & Imaging',
  'Laboratory Tests',
  'Pet Boarding',
  'Deworming',
  'Microchipping',
  'Spay/Neuter',
];

// Document Preview Card Component - handles private bucket signed URLs
const DocumentPreviewCard = ({ url, label }: { url: string; label: string }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUrl = async () => {
      setLoading(true);
      const signed = await getSignedUrl(url, 'clinic-documents');
      setSignedUrl(signed);
      setLoading(false);
    };
    loadUrl();
  }, [url]);

  const isPdf = url?.toLowerCase().endsWith('.pdf');
  
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      
      {/* Document Preview */}
      <div className="relative h-24 sm:h-32 rounded-lg overflow-hidden bg-muted/50 border border-border/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isPdf && signedUrl ? (
          <img 
            src={signedUrl} 
            alt={label} 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <FileText className="h-10 w-10" />
            <span className="text-xs font-medium">PDF Document</span>
          </div>
        )}
      </div>
      
      {/* View Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full rounded-lg gap-2 h-9 active:scale-95 transition-transform"
        onClick={() => signedUrl && window.open(signedUrl, '_blank')}
        disabled={!signedUrl}
      >
        <ExternalLink className="h-4 w-4" />
        {loading ? 'Loading...' : 'View Document'}
      </Button>
    </div>
  );
};

const ClinicProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isClinicOwner, isAdmin, isLoading: roleLoading } = useUserRole();
  const { ownedClinic, clinicLoading, updateClinic } = useClinicOwner();

  // Set document title
  useDocumentTitle('Clinic Profile');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    opening_hours: '',
    is_open: true,
    services: [] as string[],
    distance: '',
    image_url: '',
    cover_photo_url: '',
    division: '',
    district: '',
    thana: '',
  });

  // Parse existing address to extract division/district/thana
  useEffect(() => {
    if (ownedClinic) {
      // Try to parse structured location from distance field (format: "Thana, District, Division")
      let division = '';
      let district = '';
      let thana = '';
      
      if (ownedClinic.distance) {
        const parts = ownedClinic.distance.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          thana = parts[0];
          district = parts[1];
          division = parts[2];
        } else if (parts.length === 2) {
          district = parts[0];
          division = parts[1];
        } else if (parts.length === 1) {
          // Check if it's a known division
          const allDivisions = getDivisions();
          if (allDivisions.includes(parts[0])) {
            division = parts[0];
          }
        }
      }
      
      setFormData({
        name: ownedClinic.name || '',
        address: ownedClinic.address || '',
        phone: ownedClinic.phone || '',
        email: ownedClinic.email || '',
        description: ownedClinic.description || '',
        opening_hours: ownedClinic.opening_hours || '',
        is_open: ownedClinic.is_open ?? true,
        services: ownedClinic.services || [],
        distance: ownedClinic.distance || '',
        image_url: ownedClinic.image_url || '',
        cover_photo_url: ownedClinic.cover_photo_url || '',
        division,
        district,
        thana,
      });
    }
  }, [ownedClinic]);

  // Cascading location data
  const availableDivisions = useMemo(() => getDivisions(), []);
  const availableDistricts = useMemo(() => formData.division ? getDistricts(formData.division) : [], [formData.division]);
  const availableThanas = useMemo(() => (formData.division && formData.district) ? getThanas(formData.division, formData.district) : [], [formData.division, formData.district]);

  const uploadImage = async (file: File, type: 'avatar' | 'cover') => {
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    setUploading(true);

    try {
      // Compress image before upload
      const compressed = await compressImage(file, 'clinic');
      
      if (compressed.compressionRatio > 1) {
        toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
      }

      const fileExt = compressed.file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      // Path must start with clinic ID for RLS policy
      const filePath = `${ownedClinic?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clinic-images')
        .upload(filePath, compressed.file, { upsert: true });

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          toast.error('Storage not configured. Please contact support.');
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-images')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
        toast.success('Clinic photo updated!');
      } else {
        setFormData(prev => ({ ...prev, cover_photo_url: publicUrl }));
        toast.success('Cover photo updated!');
      }
    } catch (error) {
      logger.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0], 'avatar');
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0], 'cover');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Clinic name is required');
      return;
    }

    // Build structured distance from cascading selects
    const locationParts = [formData.thana, formData.district, formData.division].filter(Boolean);
    const structuredDistance = locationParts.length > 0 ? locationParts.join(', ') : formData.distance;

    updateClinic.mutate({
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      description: formData.description || null,
      opening_hours: formData.opening_hours || null,
      is_open: formData.is_open,
      services: formData.services.length > 0 ? formData.services : null,
      distance: structuredDistance || null,
      image_url: formData.image_url || null,
      cover_photo_url: formData.cover_photo_url || null,
    });
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/30 via-background to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Auth/role guard handled by RequireClinicOwner wrapper in App.tsx

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-background to-background pb-24 md:pb-8">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0 active:scale-95 transition-transform"
              onClick={() => navigate('/clinic/dashboard')}
              aria-label="Go back to dashboard"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground truncate">Edit Clinic Profile</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Update your clinic's public information</p>
            </div>
          </div>
          {/* View Public Profile Button */}
          <Button 
            variant="outline" 
            className="rounded-xl h-10 sm:h-9 gap-2 active:scale-95 transition-transform min-h-[44px] sm:min-h-0"
            onClick={() => ownedClinic?.id && navigate(`/clinic/${ownedClinic.id}`)}
            disabled={!ownedClinic?.id}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">View Public</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Hero Section - Clinic Preview Card */}
          <Card className="bg-white border-border/50 shadow-xl overflow-hidden rounded-2xl sm:rounded-3xl">
            {/* Cover Photo Display */}
            <div 
              className={cn(
                "h-36 sm:h-44 md:h-52 relative bg-cover bg-center transition-all duration-300",
                !formData.cover_photo_url && "bg-gradient-to-br from-primary/20 via-accent/15 to-lavender/20"
              )}
              style={formData.cover_photo_url ? { backgroundImage: `url(${formData.cover_photo_url})` } : undefined}
            >
              {/* Overlay for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

              {/* Quick Status Toggle - Top Right */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_open: !prev.is_open }))}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 border",
                    formData.is_open 
                      ? "bg-emerald-500/95 text-white hover:bg-emerald-500 border-emerald-400/30" 
                      : "bg-red-500/95 text-white hover:bg-red-500 border-red-400/30"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse",
                    formData.is_open ? "bg-white" : "bg-white/70"
                  )} />
                  <span className="text-xs sm:text-sm font-semibold">
                    {formData.is_open ? 'Open' : 'Closed'}
                  </span>
                </button>
              </div>

              {/* Edit Cover Photo Button - Bottom Right */}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-white/90 backdrop-blur-sm text-foreground text-xs font-medium shadow-lg hover:bg-white transition-all active:scale-95 border border-white/50"
              >
                {uploadingCover ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Edit Cover</span>
              </button>
            </div>
            
            {/* Avatar and Info Section */}
            <CardContent className="pt-0 -mt-14 sm:-mt-16 md:-mt-18 relative px-4 sm:px-6 pb-5 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-5">
                {/* Avatar Display with Edit Button */}
                <div className="relative flex-shrink-0 group">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 border-white shadow-2xl ring-4 ring-primary/10">
                    <AvatarImage src={formData.image_url} className="object-cover" />
                    <AvatarFallback className="text-3xl sm:text-4xl bg-gradient-to-br from-primary via-orange-400 to-amber-400 text-white">
                      <Building2 className="h-10 w-10 sm:h-12 sm:w-12" />
                    </AvatarFallback>
                  </Avatar>
                  {/* Edit Avatar Button */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white shadow-lg border-2 border-white flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Clinic Info */}
                <div className="flex-1 text-center sm:text-left pb-1 min-w-0 space-y-2 sm:space-y-2.5">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate leading-tight">
                    {formData.name || 'Your Clinic Name'}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base truncate flex items-center justify-center sm:justify-start gap-1.5">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-primary/70" />
                    {formData.address || 'Add your clinic address'}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                    {ownedClinic?.is_verified ? (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 gap-1.5 text-xs px-3 py-1.5 rounded-full shadow-sm">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified Clinic
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs px-3 py-1.5 rounded-full">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Verification
                      </Badge>
                    )}
                    {formData.phone && (
                      <Badge variant="outline" className="text-muted-foreground text-xs px-3 py-1.5 rounded-full bg-muted/30">
                        <Phone className="h-3 w-3 mr-1.5" />
                        {formData.phone}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats / Status Bar */}
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      formData.is_open ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                    )} />
                    <span className="font-medium text-foreground/80">
                      Status: <span className={cn(
                        "font-semibold",
                        formData.is_open ? "text-emerald-600" : "text-red-500"
                      )}>
                        {formData.is_open ? 'Currently Open' : 'Currently Closed'}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_open: !prev.is_open }))}
                    className={cn(
                      "flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-sm w-full sm:w-auto justify-center",
                      formData.is_open 
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" 
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                    )}
                  >
                    {formData.is_open ? (
                      <>
                        <X className="h-4 w-4" />
                        Close Clinic
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Open Clinic
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info with Photo Uploads */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your clinic's public details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              {/* Hidden file inputs */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />

              {/* Photo Uploads Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Profile Photo Upload */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    Clinic Logo
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-background shadow-md">
                        <AvatarImage src={formData.image_url} className="object-cover" />
                        <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-orange-400 text-white">
                          <Building2 className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        Square image, max 5MB
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className="rounded-lg h-8 text-xs active:scale-95 transition-transform"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1" />
                          {formData.image_url ? 'Change' : 'Upload'}
                        </Button>
                        {formData.image_url && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="rounded-lg h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-transform px-2"
                            onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cover Photo Upload */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Cover Photo
                  </Label>
                  <div 
                    className={cn(
                      "relative h-16 sm:h-20 rounded-lg overflow-hidden bg-cover bg-center border border-border/50",
                      !formData.cover_photo_url && "bg-gradient-to-br from-primary/20 via-orange-100 to-amber-50"
                    )}
                    style={formData.cover_photo_url ? { backgroundImage: `url(${formData.cover_photo_url})` } : undefined}
                  >
                    {!formData.cover_photo_url && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      1200x400px, max 5MB
                    </p>
                    <div className="flex gap-1.5">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        className="rounded-lg h-8 text-xs active:scale-95 transition-transform"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploadingCover}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        {formData.cover_photo_url ? 'Change' : 'Upload'}
                      </Button>
                      {formData.cover_photo_url && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="rounded-lg h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-transform px-2"
                          onClick={() => setFormData(prev => ({ ...prev, cover_photo_url: '' }))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Clinic Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Clinic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Happy Paws Veterinary Clinic"
                  className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell pet owners about your clinic, specializations, facilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="rounded-xl resize-none text-base sm:text-sm min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Contact & Location
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">How pet owners can reach and find your clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              {/* Cascading Location Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Division</Label>
                  <Select
                    value={formData.division}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, division: value, district: '', thana: '' }))}
                  >
                    <SelectTrigger className="rounded-xl h-11 sm:h-10 text-base sm:text-sm">
                      <SelectValue placeholder="Select Division" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDivisions.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">District</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, district: value, thana: '' }))}
                    disabled={!formData.division}
                  >
                    <SelectTrigger className="rounded-xl h-11 sm:h-10 text-base sm:text-sm">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDistricts.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Thana</Label>
                  <Select
                    value={formData.thana}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, thana: value }))}
                    disabled={!formData.district}
                  >
                    <SelectTrigger className="rounded-xl h-11 sm:h-10 text-base sm:text-sm">
                      <SelectValue placeholder="Select Thana" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableThanas.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Detailed Address</Label>
                <Textarea
                  id="address"
                  placeholder="House #, Road #, Area/Landmark"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="rounded-xl resize-none text-base sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">Street address, house number, or nearby landmarks</p>
              </div>

              <Separator className="my-2" />

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="clinic@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Offered */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Services Offered</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Select all services your clinic provides</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map((service) => (
                  <button
                    type="button"
                    key={service}
                    onClick={() => toggleService(service)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-2 sm:py-1.5 text-xs sm:text-sm font-semibold transition-all active:scale-95 touch-manipulation select-none",
                      formData.services.includes(service) 
                        ? 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90' 
                        : 'border-input bg-background hover:bg-primary/10 hover:border-primary/50'
                    )}
                  >
                    {formData.services.includes(service) && (
                      <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {service}
                  </button>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                <span className="font-semibold text-primary">{formData.services.length}</span> service(s) selected
              </p>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Operating Hours
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">When is your clinic open for appointments?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              {/* Clinic Status Toggle - Using button instead of Switch to avoid ref issues */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-sm sm:text-base font-medium">Clinic Status</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formData.is_open ? 'Your clinic is visible as open' : 'Your clinic is visible as closed'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_open: !prev.is_open }))}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    formData.is_open ? "bg-emerald-500" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      formData.is_open ? "translate-x-6" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="text-sm font-medium">Opening Hours</Label>
                <Input
                  id="hours"
                  placeholder="e.g., Sat-Thu: 9AM-8PM, Fri: 4PM-8PM"
                  value={formData.opening_hours}
                  onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                  className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Describe your typical operating schedule
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Verification Details Section - Always Visible */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Verification Details
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {(ownedClinic?.owner_name || ownedClinic?.bvc_certificate_url || ownedClinic?.trade_license_url) 
                      ? "Documents submitted during clinic registration"
                      : "Submit your documents to get verified"}
                  </CardDescription>
                </div>
                {/* Verification Status Badge */}
                <Badge 
                  variant={(!ownedClinic?.verification_status || ownedClinic?.verification_status === 'not_submitted') ? 'outline' : 'default'}
                  className={cn(
                    "self-start sm:self-center gap-1.5 text-xs px-3 py-1.5 shrink-0",
                    ownedClinic?.verification_status === 'approved' && "bg-emerald-500 hover:bg-emerald-500",
                    ownedClinic?.verification_status === 'pending' && "bg-amber-500 hover:bg-amber-500",
                    ownedClinic?.verification_status === 'rejected' && "bg-red-500 hover:bg-red-500",
                    (!ownedClinic?.verification_status || ownedClinic?.verification_status === 'not_submitted') && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {ownedClinic?.verification_status === 'approved' && <CheckCircle className="h-3.5 w-3.5" />}
                  {ownedClinic?.verification_status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                  {ownedClinic?.verification_status === 'rejected' && <AlertCircle className="h-3.5 w-3.5" />}
                  {(!ownedClinic?.verification_status || ownedClinic?.verification_status === 'not_submitted') && <Shield className="h-3.5 w-3.5" />}
                  {ownedClinic?.verification_status === 'approved' ? 'Verified' : 
                   ownedClinic?.verification_status === 'pending' ? 'Pending Review' : 
                   ownedClinic?.verification_status === 'rejected' ? 'Rejected' : 'Not Verified'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-4 sm:px-6 pb-5 sm:pb-6 pt-0">
              {/* Show verification data if submitted, otherwise show CTA */}
              {(ownedClinic?.owner_name || ownedClinic?.bvc_certificate_url || ownedClinic?.trade_license_url) ? (
                <>
                  {/* Owner Information - Read Only */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ownedClinic?.owner_name && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-medium text-muted-foreground">Owner Name</Label>
                        </div>
                        <p className="text-base font-medium text-foreground">{ownedClinic.owner_name}</p>
                      </div>
                    )}
                    {ownedClinic?.owner_nid && (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-medium text-muted-foreground">Owner NID</Label>
                        </div>
                        <p className="text-base font-medium text-foreground font-mono">
                          {/* Partially mask NID for security - show last 4 digits */}
                          {'•'.repeat(Math.max(0, ownedClinic.owner_nid.length - 4))}{ownedClinic.owner_nid.slice(-4)}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Submitted Certificates */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Submitted Certificates
                    </Label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* BVC Certificate */}
                      {ownedClinic?.bvc_certificate_url && (
                        <DocumentPreviewCard 
                          url={ownedClinic.bvc_certificate_url} 
                          label="BVC Certificate" 
                        />
                      )}
                      
                      {/* Trade License */}
                      {ownedClinic?.trade_license_url && (
                        <DocumentPreviewCard 
                          url={ownedClinic.trade_license_url} 
                          label="Trade License" 
                        />
                      )}
                    </div>
                  </div>

                  {/* Submission Date */}
                  {ownedClinic?.verification_submitted_at && (
                    <div className="pt-2">
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Submitted: {new Date(ownedClinic.verification_submitted_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason if rejected */}
                  {ownedClinic?.verification_status === 'rejected' && ownedClinic?.rejection_reason && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                          <p className="text-sm text-red-700 mt-1">{ownedClinic.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Call to Action - Submit Verification */}
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Verify Your Clinic</h3>
                    <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
                      Submit your BVC Certificate and Trade License to get verified 
                      and unlock all clinic management features.
                    </p>
                    <Button 
                      type="button"
                      onClick={() => navigate('/clinic/verification')}
                      className="gap-2"
                    >
                      Submit Verification
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Benefits List */}
                  <div className="pt-4 border-t space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Benefits of verification:</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Verified badge on your clinic profile</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Higher visibility in clinic search results</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span>Build trust with pet parents</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Submit Button - Sticky on mobile */}
          <div className="sticky bottom-20 sm:bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 sm:bg-transparent sm:static">
            <Button 
              type="submit" 
              className="w-full rounded-xl shadow-lg shadow-primary/25 h-12 sm:h-11 text-base sm:text-sm active:scale-[0.98] transition-transform" 
              disabled={updateClinic.isPending}
            >
              {updateClinic.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Clinic Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default ClinicProfile;
