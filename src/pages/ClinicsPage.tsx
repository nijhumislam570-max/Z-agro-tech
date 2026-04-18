import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Loader2, MapPin, Filter, Star, 
  Building2, Clock, Shield, ChevronDown, X,
  Stethoscope, Heart, Award, Navigation, MapPinned
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import ClinicCard from '@/components/ClinicCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { getDivisions, getDistricts, findNearestDivision } from '@/lib/bangladeshRegions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { prefetchRoute } from '@/lib/imageUtils';
import SEO from '@/components/SEO';

// Wrapper to apply route prefetch on hover/touch
const ClinicCardWithPrefetch = memo(({ clinic, onBook, onViewDetails }: { clinic: any; onBook: () => void; onViewDetails: () => void }) => {
  return (
    <div onMouseEnter={() => prefetchRoute(`/clinic/${clinic.id}`)} onTouchStart={() => prefetchRoute(`/clinic/${clinic.id}`)}>
      <ClinicCard
        id={clinic.id}
        name={clinic.name}
        rating={clinic.rating || 4.5}
        distance={clinic.distance || '2 km'}
        services={clinic.services || []}
        image={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400'}
        isOpen={clinic.is_open ?? true}
        isVerified={clinic.is_verified ?? true}
        onBook={onBook}
        onViewDetails={onViewDetails}
      />
    </div>
  );
});
ClinicCardWithPrefetch.displayName = 'ClinicCardWithPrefetch';

const serviceFilters = [
  'All Services',
  'General Checkup',
  'Vaccination',
  'Surgery',
  'Dental Care',
  'Emergency Care',
  'Grooming',
  'X-Ray & Imaging',
];

interface UserLocation {
  type: 'default' | 'gps' | 'manual';
  division: string;
  district?: string;
  displayName: string;
}

const LOCATION_STORAGE_KEY = 'vetmedix_user_location';

const ClinicsPage = () => {
  useDocumentTitle('Find Clinics');
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const [sortBy, setSortBy] = useState('recommended');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const navigate = useNavigate();

  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation>(() => {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { type: 'default', division: 'Dhaka', displayName: 'Dhaka (Default)' };
      }
    }
    return { type: 'default', division: 'Dhaka', displayName: 'Dhaka (Default)' };
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Save location to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(userLocation));
  }, [userLocation]);

  // Request GPS location
  const requestGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearestDivision = findNearestDivision(latitude, longitude);
        setUserLocation({
          type: 'gps',
          division: nearestDivision,
          displayName: `${nearestDivision} (GPS)`
        });
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable GPS.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out';
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Handle manual location selection
  const handleLocationSelect = () => {
    if (selectedDivision) {
      const displayName = selectedDistrict 
        ? `${selectedDistrict}, ${selectedDivision}`
        : selectedDivision;
      setUserLocation({
        type: 'manual',
        division: selectedDivision,
        district: selectedDistrict || undefined,
        displayName
      });
      setLocationSheetOpen(false);
      setSelectedDivision('');
      setSelectedDistrict('');
    }
  };

  // Reset to default Dhaka
  const resetToDefault = () => {
    setUserLocation({ type: 'default', division: 'Dhaka', displayName: 'Dhaka (Default)' });
    setLocationError(null);
  };

  // Calculate location match score for clinic — memoized to prevent re-computation on every render
  const calculateLocationScore = useCallback((clinicAddress: string | null): number => {
    if (!clinicAddress) return 0;
    const address = clinicAddress.toLowerCase();
    
    // Exact district match
    if (userLocation.district && address.includes(userLocation.district.toLowerCase())) {
      return 100;
    }
    // Division match
    if (address.includes(userLocation.division.toLowerCase())) {
      return 50;
    }
    return 0;
  }, [userLocation.division, userLocation.district]);

  // React Query for clinics data
  const { data: clinicsData = [], isLoading: loading } = useQuery({
    queryKey: ['public-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics_public')
        .select('*');
      if (error) throw error;
      
      return (data || []).sort((a: any, b: any) => {
        const aIsGopalganj = a.name?.toLowerCase().includes('gopalganj');
        const bIsGopalganj = b.name?.toLowerCase().includes('gopalganj');
        if (aIsGopalganj && !bIsGopalganj) return -1;
        if (!aIsGopalganj && bIsGopalganj) return 1;
        return 0;
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  // Realtime subscription for clinics
  useEffect(() => {
    const channel = supabase
      .channel('public-clinics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinics' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['public-clinics'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const clinics = clinicsData;

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredClinics = useMemo(() => clinics
    .map(clinic => ({
      ...clinic,
      locationScore: calculateLocationScore(clinic.address || clinic.name)
    }))
    .filter(c => c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .filter(c => selectedService === 'All Services' || c.services?.includes(selectedService))
    .filter(c => !showOnlyOpen || c.is_open)
    .filter(c => !showOnlyVerified || c.is_verified)
    .sort((a, b) => {
      // Primary: Location score (higher = better match)
      if (b.locationScore !== a.locationScore) {
        return b.locationScore - a.locationScore;
      }
      // Secondary: Regular sorting
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // Default: Keep Gopalganj at top for branding
      const aIsGopalganj = a.name?.toLowerCase().includes('gopalganj');
      const bIsGopalganj = b.name?.toLowerCase().includes('gopalganj');
      if (aIsGopalganj && !bIsGopalganj) return -1;
      if (!aIsGopalganj && bIsGopalganj) return 1;
      return 0;
    }),
  [clinics, debouncedSearch, selectedService, showOnlyOpen, showOnlyVerified, sortBy, calculateLocationScore]);

  const activeFiltersCount = [
    selectedService !== 'All Services',
    showOnlyOpen,
    showOnlyVerified,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedService('All Services');
    setShowOnlyOpen(false);
    setShowOnlyVerified(false);
    setSearchQuery('');
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Service Filter */}
      <div>
        <h4 className="font-medium mb-3">Service Type</h4>
        <div className="flex flex-wrap gap-2">
          {serviceFilters.map((service) => (
            <Badge
              key={service}
              variant={selectedService === service ? 'default' : 'outline'}
              className="cursor-pointer transition-all hover:scale-105 min-h-[44px] px-3 flex items-center"
              onClick={() => setSelectedService(service)}
            >
              {service}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="font-medium mb-3">Status</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              <span className="text-sm">Open Now</span>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={showOnlyVerified}
              onChange={(e) => setShowOnlyVerified(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm">Verified Only</span>
            </div>
          </label>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-background to-background pb-24 md:pb-0">
      <SEO 
        title="Find Veterinary Clinics"
        description="Find trusted veterinary clinics near you in Bangladesh. Book appointments, read reviews, and get the best care for your pets."
        url="https://vetmedix.lovable.app/clinics"
        schema={{ type: 'Organization', name: 'VetMedix Clinics', url: 'https://vetmedix.lovable.app/clinics', description: 'Trusted veterinary clinics in Bangladesh' }}
      />
      <Navbar />
      
      {/* Hero Banner - Compact mobile-first */}
      <div className="relative bg-gradient-to-br from-primary/8 via-orange-50 to-amber-50/80 border-b border-border/40 overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 lg:py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 text-primary text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 bg-white/70 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-primary/10">
              <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 
              Trusted Veterinary Care
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-1 sm:mb-2">
              Veterinary Clinics
            </h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground max-w-md mx-auto mb-3 sm:mb-5 px-1">
              Find and book appointments with trusted clinics near you.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search clinics..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 sm:h-12 lg:h-13 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl bg-white border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-8 mt-3 sm:mt-5">
              <div className="text-center">
                <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">{clinics.length}+</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground">Clinics</div>
              </div>
              <div className="w-px h-5 sm:h-7 bg-border/60" />
              <div className="text-center">
                <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">4.8</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground">Avg Rating</div>
              </div>
              <div className="w-px h-5 sm:h-7 bg-border/60" />
              <div className="text-center">
                <div className="text-base sm:text-xl lg:text-2xl font-bold text-foreground">24/7</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground">Emergency</div>
              </div>
              <div className="w-px h-5 sm:h-7 bg-border/60" />
              <button
                onClick={() => navigate('/wishlist')}
                className="flex flex-col items-center gap-0.5 group min-w-[44px] min-h-[44px] justify-center"
                aria-label="View Wishlist"
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                </div>
                <div className="text-[9px] sm:text-xs text-muted-foreground">Wishlist</div>
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-16 sm:w-28 h-16 sm:h-28 bg-primary/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-20 sm:w-36 h-20 sm:h-36 bg-orange-200/20 rounded-full blur-2xl" />
      </div>

      {/* Location Banner - Compact mobile-first */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/8 to-orange-50/80 border-b border-border/30">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Location Display */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPinned className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Showing in</span>
                  <span className="font-semibold text-xs sm:text-sm text-foreground truncate">{userLocation.displayName}</span>
                </div>
                <p className="text-[9px] sm:text-[11px] text-muted-foreground truncate">
                  {userLocation.type === 'default' 
                    ? 'Enable GPS to find clinics near you' 
                    : userLocation.type === 'gps' 
                      ? 'Location detected via GPS'
                      : 'Manually selected'}
                </p>
              </div>
            </div>

            {/* Location Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant={userLocation.type === 'gps' ? 'default' : 'outline'}
                size="sm"
                onClick={requestGPSLocation}
                disabled={locationLoading}
                className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 min-h-[36px] sm:min-h-[40px]"
              >
                {locationLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Navigation className="h-3 w-3" />
                )}
                GPS
              </Button>

              {/* Location Selector */}
              <Sheet open={locationSheetOpen} onOpenChange={setLocationSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 min-h-[36px] sm:min-h-[40px]"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">Change Location</span>
                    <span className="xs:hidden">Location</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh] sm:h-auto sm:max-h-[80vh]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Select Your Location
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 sm:mt-6 space-y-4">
                    {/* Division Select */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Division</label>
                      <Select value={selectedDivision} onValueChange={(val) => {
                        setSelectedDivision(val);
                        setSelectedDistrict('');
                      }}>
                        <SelectTrigger className="w-full h-10 sm:h-11">
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDivisions().map((division) => (
                            <SelectItem key={division} value={division}>{division}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* District Select */}
                    {selectedDivision && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">District (Optional)</label>
                        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                          <SelectTrigger className="w-full h-10 sm:h-11">
                            <SelectValue placeholder="Select District (Optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDistricts(selectedDivision).map((district) => (
                              <SelectItem key={district} value={district}>{district}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetToDefault();
                          setLocationSheetOpen(false);
                        }}
                        className="flex-1"
                      >
                        Reset to Dhaka
                      </Button>
                      <Button
                        onClick={handleLocationSelect}
                        disabled={!selectedDivision}
                        className="flex-1"
                      >
                        Apply Location
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Reset Button (if not default) */}
              {userLocation.type !== 'default' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetToDefault}
                  className="h-8 sm:h-9 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {locationError && (
            <div className="mt-2 text-center sm:text-left">
              <p className="text-xs text-destructive">{locationError}</p>
            </div>
          )}
        </div>
      </div>

      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Filter Bar - Mobile optimized */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          {/* Filters Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden gap-1.5 h-8 text-xs flex-shrink-0">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-80">
                <SheetHeader>
                  <SheetTitle>Filter Clinics</SheetTitle>
                </SheetHeader>
                <div className="mt-4 sm:mt-6">
                  {filterContent}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="w-40 bg-white h-9 text-sm">
                  <Stethoscope className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceFilters.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showOnlyOpen ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                className="gap-1.5 min-h-[44px] h-auto py-2 text-sm"
              >
                <Clock className="h-4 w-4" />
                Open Now
              </Button>

              <Button
                variant={showOnlyVerified ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyVerified(!showOnlyVerified)}
                className="gap-1.5 min-h-[44px] h-auto py-2 text-sm"
              >
                <Shield className="h-4 w-4" />
                Verified
              </Button>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground min-h-[44px] h-auto py-2 text-sm">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Mobile Quick Filters - with proper touch targets */}
            <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
              <Button
                variant={showOnlyOpen ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                className="gap-1.5 min-h-[44px] h-auto py-2 text-xs px-3"
              >
                <Clock className="h-4 w-4" />
                Open
              </Button>
              <Button
                variant={showOnlyVerified ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyVerified(!showOnlyVerified)}
                className="gap-1.5 min-h-[44px] h-auto py-2 text-xs px-3"
              >
                <Shield className="h-4 w-4" />
                Verified
              </Button>
            </div>
          </div>

          {/* Sort and Count Row */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''}
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 sm:w-36 bg-white h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display - Mobile optimized */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-xs text-muted-foreground">Filters:</span>
            {selectedService !== 'All Services' && (
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                {selectedService}
                <X 
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer" 
                  onClick={() => setSelectedService('All Services')}
                />
              </Badge>
            )}
            {showOnlyOpen && (
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                Open
                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer" onClick={() => setShowOnlyOpen(false)} />
              </Badge>
            )}
            {showOnlyVerified && (
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                Verified
                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer" onClick={() => setShowOnlyVerified(false)} />
              </Badge>
            )}
          </div>
        )}

        {/* Clinics Grid - Mobile optimized */}
        {loading ? (
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg sm:rounded-xl flex-shrink-0 animate-pulse-slow" />
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <Skeleton className="h-5 sm:h-6 w-3/4 animate-pulse-slow" />
                    <Skeleton className="h-4 w-1/2 animate-pulse-slow" />
                    <div className="flex gap-1.5 sm:gap-2">
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 animate-pulse-slow" />
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 animate-pulse-slow" />
                    </div>
                    <div className="flex gap-2 pt-1 sm:pt-2">
                      <Skeleton className="h-8 sm:h-10 flex-1 animate-pulse-slow" />
                      <Skeleton className="h-8 sm:h-10 flex-1 animate-pulse-slow" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-10 sm:py-16 bg-white rounded-xl sm:rounded-2xl border border-border max-w-sm sm:max-w-lg mx-auto">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Building2 className="h-7 w-7 sm:h-10 sm:w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">No clinics found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-4">
              Try adjusting your filters or search query
            </p>
            <Button onClick={clearFilters} variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            {filteredClinics.map(clinic => (
              <ClinicCardWithPrefetch
                key={clinic.id}
                clinic={clinic}
                onBook={() => navigate(`/book-appointment/${clinic.id}`)}
                onViewDetails={() => navigate(`/clinic/${clinic.id}`)}
              />
            ))}
          </div>
        )}

        {/* Trust Section - Mobile optimized */}
        <div className="mt-8 sm:mt-12 lg:mt-16 bg-gradient-to-r from-primary/5 via-orange-50/50 to-amber-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground mb-1 sm:mb-2">
              Why Choose Our Clinics?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Quality veterinary care you can trust
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">Verified</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Licensed by veterinary authorities
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">Expert</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Specialized qualifications
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-rose-500" />
              </div>
              <h3 className="font-semibold text-foreground text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">Caring</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Gentle treatment every visit
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default ClinicsPage;
