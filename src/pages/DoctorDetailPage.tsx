import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, Clock, Award, BadgeCheck, Calendar,
  Stethoscope, GraduationCap, Building2, ChevronRight, Heart
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicDoctorById } from '@/hooks/usePublicDoctors';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { prefetchRoute } from '@/lib/imageUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DoctorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: doctor, isLoading } = usePublicDoctorById(id);
  
  // Prefetch the booking wizard for the primary affiliated clinic
  const primaryClinicId = doctor?.affiliations?.[0]?.clinic?.id;
  const bookPath = primaryClinicId ? `/book-appointment/${primaryClinicId}` : '/doctors';
  const bookPrefetch = { onMouseEnter: () => prefetchRoute(bookPath), onTouchStart: () => prefetchRoute(bookPath) };
  
  useDocumentTitle(doctor?.name ? `Dr. ${doctor.name}` : 'Doctor Profile');

  // Check if doctor is favorited
  useEffect(() => {
    if (!id) return;
    const checkFav = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('doctor_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('doctor_id', id)
        .maybeSingle();
      setIsFavorite(!!data);
    };
    checkFav();
  }, [id]);

  const toggleFavorite = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    if (isFavorite) {
      await supabase.from('doctor_favorites').delete().eq('user_id', user.id).eq('doctor_id', id!);
      setIsFavorite(false);
      toast.success('Removed from favorites');
    } else {
      await supabase.from('doctor_favorites').insert({ user_id: user.id, doctor_id: id! });
      setIsFavorite(true);
      toast.success('Added to favorites');
    }
  }, [id, isFavorite]);
  
  // SEO structured data for doctor
  const doctorSchema = useMemo(() => doctor ? {
    type: 'Physician' as const,
    name: `Dr. ${doctor.name}`,
    image: doctor.avatar_url || undefined,
    description: doctor.bio || `${doctor.specialization || 'Veterinarian'} with ${doctor.experience_years || 0}+ years of experience.`,
    medicalSpecialty: doctor.specialization || 'Veterinary Medicine',
    qualification: doctor.qualifications || undefined,
    worksFor: doctor.affiliations?.map((aff: any) => ({
      name: aff.clinic.name,
      url: `https://vetmedix.lovable.app/clinic/${aff.clinic.id}`,
    })) || [],
    url: `https://vetmedix.lovable.app/doctor/${doctor.id}`,
  } : undefined, [doctor]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full animate-pulse-slow" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 animate-pulse-slow" />
                <Skeleton className="h-4 w-32 animate-pulse-slow" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-2xl animate-pulse-slow" />
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-0">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-12 text-center">
          <h1 className="text-xl font-semibold mb-2">Doctor not found</h1>
          <p className="text-muted-foreground mb-4">The doctor you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/doctors')}>View All Doctors</Button>
        </div>
        <MobileNav />
      </div>
    );
  }

  const initials = doctor.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'DR';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-24 md:pb-0">
      {doctorSchema && (
        <SEO 
          title={`Dr. ${doctor.name}`}
          description={doctor.bio || `Book an appointment with Dr. ${doctor.name}, ${doctor.specialization || 'Veterinarian'}.`}
          image={doctor.avatar_url || undefined}
          url={`https://vetmedix.lovable.app/doctor/${doctor.id}`}
          schema={doctorSchema}
          canonicalUrl={`https://vetmedix.lovable.app/doctor/${doctor.id}`}
        />
      )}
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary border-b border-border/50">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {/* Back + Favorite */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="-ml-2 gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFavorite}
              className="rounded-full h-9 w-9"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-lg">
                <AvatarImage src={doctor.avatar_url || undefined} alt={doctor.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl sm:text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {doctor.is_available && (
                <div className="absolute bottom-1 right-1 h-6 w-6 sm:h-8 sm:w-8 bg-accent rounded-full border-3 border-white flex items-center justify-center">
                  <div className="h-2 w-2 sm:h-3 sm:w-3 bg-white rounded-full" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  {doctor.name}
                </h1>
                {doctor.is_verified && (
                  <Badge className="gap-1 bg-primary/10 text-primary border-0">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-3">
                {doctor.specialization || 'General Veterinarian'}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                {doctor.experience_years && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{doctor.experience_years}+ years exp.</span>
                  </div>
                )}
                {doctor.consultation_fee && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-semibold text-primary">৳{doctor.consultation_fee}</span>
                    <span className="text-sm text-muted-foreground">per visit</span>
                  </div>
                )}
              </div>

              {/* Qualifications */}
              {doctor.qualifications && doctor.qualifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {doctor.qualifications.map((qual: string) => (
                    <Badge key={qual} variant="secondary" className="text-xs px-2.5 py-1">
                      {qual}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sm:w-auto h-10 sm:h-11 mb-6">
              <TabsTrigger value="about" className="flex-1 sm:flex-none text-sm gap-1.5">
                <Stethoscope className="h-4 w-4" />
                About
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex-1 sm:flex-none text-sm gap-1.5">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="clinics" className="flex-1 sm:flex-none text-sm gap-1.5">
                <Building2 className="h-4 w-4" />
                Clinics
              </TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              {doctor.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {doctor.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Specialization & Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Primary Specialization</h4>
                    <Badge className="text-sm px-3 py-1.5">
                      {doctor.specialization || 'General Veterinarian'}
                    </Badge>
                  </div>
                  
                  {doctor.qualifications && doctor.qualifications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Qualifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {doctor.qualifications.map((qual: string) => (
                          <Badge key={qual} variant="outline" className="text-xs px-2.5 py-1">
                            {qual}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {doctor.experience_years && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Experience</h4>
                      <p className="text-sm">{doctor.experience_years} years of professional experience</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {doctor.schedules && doctor.schedules.length > 0 ? (
                    <div className="space-y-3">
                      {DAYS.map((day, index) => {
                        const schedule = doctor.schedules.find((s: any) => s.day_of_week === index);
                        return (
                          <div key={day} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm font-medium">{day}</span>
                            {schedule && schedule.is_available ? (
                              <span className="text-sm text-primary">
                                {schedule.start_time} - {schedule.end_time}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Unavailable</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Schedule information not available. Please contact the clinic directly.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Clinics Tab */}
            <TabsContent value="clinics" className="space-y-4">
              {doctor.affiliations && doctor.affiliations.length > 0 ? (
                doctor.affiliations.map((aff: any) => (
                  <Card key={aff.clinic_id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/clinic/${aff.clinic.id}`)}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-base sm:text-lg">{aff.clinic.name}</h3>
                            {aff.clinic.is_verified && (
                              <Badge variant="outline" className="text-[10px] gap-0.5 border-primary/30 text-primary">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          {aff.clinic.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span>{aff.clinic.address}</span>
                            </div>
                          )}
                          
                          {aff.clinic.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{aff.clinic.phone}</span>
                            </div>
                          )}

                          <Button 
                            size="sm"
                            variant="warm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/book-appointment/${aff.clinic.id}?doctor=${doctor.id}`);
                            }}
                            className="mt-2"
                            {...bookPrefetch}
                          >
                            Book Appointment
                          </Button>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No clinic affiliations found.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default DoctorDetailPage;
