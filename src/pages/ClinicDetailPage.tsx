import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Phone, Stethoscope, User, Calendar, ChevronRight, Award, Heart, Shield, Loader2, MessageSquare, Share2, ChevronLeft, CheckCircle, Building2, AlertCircle, Users, Sparkles, BadgeCheck, Copy, Navigation } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import gopalganjLogo from '@/assets/gopalganj-vet-care-logo.png';
import ClinicReviewsSection from '@/components/clinic/ClinicReviewsSection';
import { useClinicReviews } from '@/hooks/useClinicReviews';
import { useClinicDoctorsWithSchedules } from '@/hooks/useDoctorSchedules';
import BookAppointmentDialog from '@/components/clinic/BookAppointmentDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import SEO from '@/components/SEO';
import { useGeocode } from '@/hooks/useGeocode';
import { prefetchRoute } from '@/lib/imageUtils';

// Clinic interface for clinics_public view (excludes sensitive fields like verification docs)
interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  distance: string | null;
  services: string[] | null;
  image_url: string | null;
  cover_photo_url: string | null;
  is_open: boolean | null;
  is_verified: boolean | null;
  opening_hours: string | null;
  description: string | null;
  created_at?: string;
  // Note: is_blocked not included - clinics_public view filters out blocked clinics
}

const ClinicDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const isGopalganj = clinic?.name?.toLowerCase().includes('gopalganj');
  const bookPrefetch = { onMouseEnter: () => prefetchRoute(`/book-appointment/${id}`), onTouchStart: () => prefetchRoute(`/book-appointment/${id}`) };
  
  useDocumentTitle(clinic?.name || 'Clinic Details');
  
  // Use the reviews hook for rating stats
  const { ratingStats } = useClinicReviews(id || '');
  
  // Fetch doctors for booking
  const { data: doctorsWithSchedules = [], isLoading: doctorsLoading } = useClinicDoctorsWithSchedules(id || '');
  
  // SEO structured data for clinic
  const clinicSchema = useMemo(() => clinic ? {
    type: 'VeterinaryCare' as const,
    name: clinic.name,
    address: clinic.address || undefined,
    phone: clinic.phone || undefined,
    email: clinic.email || undefined,
    image: clinic.image_url || undefined,
    rating: ratingStats.average || clinic.rating || undefined,
    reviewCount: ratingStats.total || undefined,
    openingHours: clinic.opening_hours || undefined,
    url: `https://vetmedix.lovable.app/clinic/${clinic.id}`,
    description: clinic.description || `${clinic.name} - Professional veterinary care for your pets in Bangladesh.`,
    priceRange: '৳৳',
  } : undefined, [clinic, ratingStats]);

  // Doctor info for Gopalganj Vet Care
  const doctorInfo = {
    name: 'Dr. Md. Mohsin Hossain',
    title: 'Pet Consultant & Surgeon',
    qualifications: ['B.Sc. Vet. Sci. & A.H. (GSTU)', 'MS in Theriogenology (BAU)', 'CT (Ultra), PGT (Japan)', 'BVC Reg. No: 9562'],
    experience: '10+ years',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
  };
  // Check if clinic is favorited
  useEffect(() => {
    if (!id) return;
    const checkFav = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase
        .from('clinic_favorites')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('clinic_id', id)
        .maybeSingle();
      setIsFavorite(!!data);
    };
    checkFav();
  }, [id]);

  const toggleFavorite = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast.error('Please sign in to save favorites');
      return;
    }
    if (isFavorite) {
      await supabase.from('clinic_favorites').delete().eq('user_id', authUser.id).eq('clinic_id', id!);
      setIsFavorite(false);
      toast.success('Removed from favorites');
    } else {
      await supabase.from('clinic_favorites').insert({ user_id: authUser.id, clinic_id: id! });
      setIsFavorite(true);
      toast.success('Added to favorites');
    }
  }, [id, isFavorite]);

  useEffect(() => {
    if (id) fetchClinic();
  }, [id]);
  const fetchClinic = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('clinics_public').select('*').eq('id', id).single();
      if (error) throw error;
      setClinic(data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching clinic:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: clinic?.name,
        text: `Check out ${clinic?.name} on VetMedix`,
        url: window.location.href
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };
  const handleCopyPhone = () => {
    if (clinic?.phone) {
      navigator.clipboard.writeText(clinic.phone);
      toast.success('Phone number copied!');
    }
  };

  const mapQuery = useMemo(() => {
    const address = (clinic?.address || '').trim();
    const name = (clinic?.name || '').trim();

    // Prefer address-only for geocoding — clinic names confuse Nominatim
    const base = address || name;

    if (!base) return '';

    // Helpful for more accurate results when address is short
    return /bangladesh/i.test(base) ? base : `${base}, Bangladesh`;
  }, [clinic?.address, clinic?.name]);

  // For Google Maps links, use full name+address for best results
  const googleMapsQuery = useMemo(() => {
    const name = (clinic?.name || '').trim();
    const address = (clinic?.address || '').trim();
    if (!name && !address) return '';
    const full = [name, address].filter(Boolean).join(', ');
    return /bangladesh/i.test(full) ? full : `${full}, Bangladesh`;
  }, [clinic?.name, clinic?.address]);

  const mapOpenUrl = useMemo(() => {
    if (!googleMapsQuery) return '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;
  }, [googleMapsQuery]);

  const { data: geocode, isLoading: geocodeLoading } = useGeocode(mapQuery);

  const staticMapUrl = useMemo(() => {
    if (!geocode?.lat || !geocode?.lng) return '';
    // Use OpenStreetMap embed as a reliable fallback instead of unreliable staticmap service
    return '';
  }, [geocode?.lat, geocode?.lng]);

  // Use an embedded OSM iframe for reliable map display
  const mapEmbedUrl = useMemo(() => {
    if (!geocode?.lat || !geocode?.lng) return '';
    return `https://www.openstreetmap.org/export/embed.html?bbox=${Number(geocode.lng) - 0.01},${Number(geocode.lat) - 0.006},${Number(geocode.lng) + 0.01},${Number(geocode.lat) + 0.006}&layer=mapnik&marker=${geocode.lat},${geocode.lng}`;
  }, [geocode?.lat, geocode?.lng]);

  const openGoogleMaps = (url: string, popup?: Window | null) => {
    if (popup) {
      try {
        popup.location.href = url;
        return;
      } catch {
        // ignore and fall back
      }
    }

    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = url;
  };

  const handleGetDirections = () => {
    if (!googleMapsQuery) {
      toast.error('Clinic address is not available');
      return;
    }

    // Popup-blocker safe: open a blank tab immediately, then redirect it after GPS resolves.
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    setDirectionsLoading(true);

    const destination = geocode?.lat && geocode?.lng ? `${geocode.lat},${geocode.lng}` : googleMapsQuery;

    const openDestinationOnly = () => {
      // If we can't get GPS, open the place/search view (more reliable than dir with "Your location").
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
      openGoogleMaps(url, popup);
      setDirectionsLoading(false);
    };

    if (!navigator.geolocation) {
      openDestinationOnly();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(destination)}`;
        openGoogleMaps(url, popup);
        setDirectionsLoading(false);
      },
      () => {
        // Permission denied / unavailable / timeout: still open destination so the user can start navigation.
        openDestinationOnly();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading clinic details...</p>
        </div>
      </div>;
  }
  if (!clinic) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Clinic Not Found</h2>
          <p className="text-muted-foreground mb-6">The clinic you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/clinics')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Clinics
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background pb-20 md:pb-0">
      {clinicSchema && (
        <SEO 
          title={clinic.name}
          description={clinic.description || `Book an appointment at ${clinic.name}. Professional veterinary care for your pets.`}
          image={clinic.image_url || undefined}
          url={`https://vetmedix.lovable.app/clinic/${clinic.id}`}
          schema={clinicSchema}
          canonicalUrl={`https://vetmedix.lovable.app/clinic/${clinic.id}`}
        />
      )}
      <Navbar />
      
      {/* Full-width Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full overflow-hidden">
          <img src={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1600'} alt={clinic.name} className="w-full h-full object-cover" loading="eager" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Top Actions */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-xl h-10 w-10" onClick={() => navigate('/clinics')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex gap-2">
              <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-xl h-10 w-10" onClick={toggleFavorite}>
                <Heart className={`h-5 w-5 transition-colors ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur-md hover:bg-white shadow-xl h-10 w-10" onClick={handleShare}>
                <Share2 className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        {/* Clinic Info Overlay */}
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="relative -mt-24 sm:-mt-28 md:-mt-32 bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/10 border border-border/50 overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Logo */}
                <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl sm:rounded-2xl bg-white shadow-lg border-2 border-border/50 overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                  {isGopalganj ? <img src={gopalganjLogo} alt={clinic.name} className="w-full h-full object-cover" loading="eager" decoding="async" width={128} height={128} /> : <img src={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200'} alt={clinic.name} className="w-full h-full object-cover" loading="eager" decoding="async" width={128} height={128} />}
                </div>
                
                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      {/* Name & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">
                          {clinic.name}
                        </h1>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          {clinic.is_verified && <Badge className="bg-primary/10 text-primary hover:bg-primary/20 gap-1">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Verified
                            </Badge>}
                          <Badge variant="outline" className={clinic.is_open ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}>
                            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${clinic.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                            {clinic.is_open ? 'Open Now' : 'Closed'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm mb-4">
                        <button className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-amber-700">{ratingStats.average || clinic.rating || '—'}</span>
                          <span className="text-amber-600/80">({ratingStats.total} {ratingStats.total === 1 ? 'review' : 'reviews'})</span>
                        </button>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          {clinic.distance || '2 km away'}
                        </span>
                        {clinic.opening_hours && <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {clinic.opening_hours}
                          </span>}
                      </div>

                      {/* Quick Stats */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">1.2k+ Patients</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          <span className="text-muted-foreground">5+ Years</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 mt-2 lg:mt-0">
                      <Button 
                        size="lg" 
                        className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                        onClick={() => setShowBookingDialog(true)}
                        {...bookPrefetch}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                      {clinic.phone && <Button variant="outline" size="lg" asChild>
                          <a href={`tel:${clinic.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </a>
                        </Button>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 max-w-7xl mt-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto pb-2">
          <span className="cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => navigate('/')}>Home</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => navigate('/clinics')}>Clinics</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium truncate">{clinic.name}</span>
        </nav>
      </div>

      <main id="main-content" className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-white border border-border/50 rounded-xl p-1.5 h-auto flex-wrap gap-1 overflow-x-auto">
                <TabsTrigger value="about" className="rounded-lg data-[state=active]:shadow-sm px-4">
                  <Building2 className="h-4 w-4 mr-2 hidden sm:inline-block" />
                  About
                </TabsTrigger>
                <TabsTrigger value="services" className="rounded-lg data-[state=active]:shadow-sm px-4">
                  <Stethoscope className="h-4 w-4 mr-2 hidden sm:inline-block" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="doctors" className="rounded-lg data-[state=active]:shadow-sm px-4">
                  <User className="h-4 w-4 mr-2 hidden sm:inline-block" />
                  Doctors
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:shadow-sm px-4">
                  <MessageSquare className="h-4 w-4 mr-2 hidden sm:inline-block" />
                  Reviews
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-border/50">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    About This Clinic
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {clinic.description || (isGopalganj ? "Gopalganj Vet Care is the first and only dedicated pet clinic in Gopalganj, offering comprehensive veterinary services for cats, dogs, and birds. Starting January 1, 2026, we provide compassionate care for your beloved pets under one roof. Our commitment is to ensure the health and safety of your pets with professional treatment and care." : `${clinic.name} provides comprehensive veterinary services for your beloved pets. Our team of experienced veterinarians is dedicated to ensuring the health and well-being of your furry friends.`)}
                  </p>
                  
                  {/* Trust Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-orange-50/50 rounded-xl border border-primary/10">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Certified Vets</p>
                        <p className="text-xs text-muted-foreground">Licensed professionals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50/50 to-green-50/50 rounded-xl border border-emerald-100">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Emergency Care</p>
                        <p className="text-xs text-muted-foreground">24/7 available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-rose-50/50 to-pink-50/50 rounded-xl border border-rose-100">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                        <Heart className="h-6 w-6 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Pet Friendly</p>
                        <p className="text-xs text-muted-foreground">Stress-free visits</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="mt-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-border/50">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Services Offered
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(clinic.services || ['Consultation', 'Vaccination', 'Surgery', 'Dental Care', 'Grooming', 'Emergency Care']).map((service, idx) => <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-gradient-to-r hover:from-primary/5 hover:to-orange-50/50 border border-border/50 hover:border-primary/20 transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors flex-shrink-0">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground text-sm sm:text-base truncate block">{service}</span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      </div>)}
                  </div>
                </div>
              </TabsContent>

              {/* Doctors Tab */}
              <TabsContent value="doctors" className="mt-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-border/50">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Our Doctors
                  </h2>
                  
                  {isGopalganj ? <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 bg-gradient-to-br from-primary/5 via-orange-50/30 to-amber-50/30 rounded-2xl border border-primary/10">
                      <Avatar className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl border-4 border-white shadow-xl flex-shrink-0 mx-auto sm:mx-0">
                        <AvatarImage src={doctorInfo.image} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">DM</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground">{doctorInfo.name}</h3>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 w-fit mx-auto sm:mx-0">
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                        <p className="text-primary font-semibold mb-3">{doctorInfo.title}</p>
                        <div className="space-y-1.5 mb-4">
                          {doctorInfo.qualifications.map((qual, idx) => <p key={idx} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                              <Award className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              {qual}
                            </p>)}
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <Badge variant="secondary" className="bg-white">
                            <Clock className="h-3 w-3 mr-1" />
                            {doctorInfo.experience}
                          </Badge>
                          <Badge className="bg-emerald-500 hover:bg-emerald-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Available
                          </Badge>
                        </div>
                      </div>
                    </div> : <div className="text-center py-8 sm:py-12">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <User className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground">Doctor information coming soon</p>
                    </div>}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                <ClinicReviewsSection clinicId={id || ''} clinicName={clinic.name} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Appointment Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 lg:sticky lg:top-4 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-orange-50 p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-foreground">Book Appointment</h3>
                    <p className="text-sm text-muted-foreground">Schedule your visit</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Get professional veterinary care for your pet. Book an appointment in just a few steps.
                </p>
                <Button 
                  className="w-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                  size="lg"
                  onClick={() => setShowBookingDialog(true)}
                  {...bookPrefetch}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50">
              <h3 className="font-display font-bold text-foreground mb-4">Contact & Location</h3>
              
              <div className="space-y-4">
                {clinic.address && <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Address</p>
                      <p className="text-sm text-muted-foreground break-words">{clinic.address}</p>
                    </div>
                  </div>}
                
                {clinic.phone && <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <div className="flex items-center gap-2">
                        <a href={`tel:${clinic.phone}`} className="text-sm text-primary hover:underline">{clinic.phone}</a>
                        <button onClick={handleCopyPhone} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>}
                
                {clinic.opening_hours && <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Hours</p>
                      <p className="text-sm text-muted-foreground">{clinic.opening_hours}</p>
                    </div>
                  </div>}
              </div>

              <Separator className="my-4" />

               {/* Map Preview */}
               <div className="rounded-xl overflow-hidden h-40 sm:h-44 bg-muted border border-border/50">
                 {mapEmbedUrl ? (
                    <iframe
                      src={mapEmbedUrl}
                      title={`Map of ${clinic.name}`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      allowFullScreen={false}
                    />
                  ) : geocodeLoading ? (
                    <div className="w-full h-full animate-pulse bg-muted" />
                  ) : (
                    <div className="w-full h-full grid place-items-center p-4 text-center">
                      <div>
                        <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Map unavailable</p>
                      </div>
                    </div>
                  )}
                </div>

               {mapOpenUrl && (
                 <Button variant="link" asChild className="px-0 mt-1">
                   <a
                     href={mapOpenUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     aria-label="Open clinic location in Google Maps"
                   >
                     Open in Google Maps
                   </a>
                 </Button>
               )}

              <Button
                variant="outline"
                className="w-full mt-3 gap-2 min-h-[44px]"
                onClick={handleGetDirections}
                disabled={directionsLoading}
              >
                {directionsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                Get Directions
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />

      {/* Booking Dialog */}
      {/* Sticky Mobile Book Now Bar */}
      <div className="fixed bottom-14 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border p-3 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <Button 
          className="w-full min-h-[44px] shadow-lg shadow-primary/25"
          onClick={() => setShowBookingDialog(true)}
          {...bookPrefetch}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      <BookAppointmentDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        clinicId={id || ''}
        clinicName={clinic?.name || ''}
        doctors={doctorsWithSchedules}
        doctorsLoading={doctorsLoading}
        onSuccess={() => navigate('/profile')}
        onNeedAuth={() => navigate('/auth')}
      />
    </div>;
};
export default ClinicDetailPage;