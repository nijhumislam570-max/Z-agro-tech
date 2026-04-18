import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Ban, MapPin, Clock, Phone, Star, BadgeCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useClinicDoctorsWithSchedules } from '@/hooks/useDoctorSchedules';
import { useQuery } from '@tanstack/react-query';
import BookAppointmentWizard from '@/components/booking/BookAppointmentWizard';
import { 
  getClinicOwnerUserId, 
  createNewAppointmentNotification, 
  createAppointmentConfirmationNotification 
} from '@/lib/notifications';
import { format } from 'date-fns';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const BookAppointmentPage = () => {
  useDocumentTitle('Book Appointment');
  const { clinicId } = useParams();
  const [searchParams] = useSearchParams();
  const preSelectedDoctorId = searchParams.get('doctor');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isPending, setIsPending] = useState(false);
  const [waitlistPrompt, setWaitlistPrompt] = useState<{ date: string; time: string; petName: string; petType: string; doctorId: string; reason: string } | null>(null);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);

  // Fetch clinic details - use clinics_public view for security
  const { data: clinic, isLoading: clinicLoading } = useQuery({
    queryKey: ['clinic-for-booking', clinicId],
    queryFn: async () => {
      // Use clinics_public view - excludes sensitive verification documents
      const { data, error } = await supabase
        .from('clinics_public')
        .select('id, name, is_verified, image_url, address, phone, opening_hours, rating')
        .eq('id', clinicId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clinicId,
  });

  const { data: doctorsWithSchedules = [], isLoading: doctorsLoading } = useClinicDoctorsWithSchedules(clinicId || '');

  const handleSubmit = async (formData: any) => {
    if (!user) { 
      navigate('/auth'); 
      return; 
    }
    
    setIsPending(true);
    try {
      // CRITICAL: Use book_appointment_atomic RPC — prevents race conditions & double-booking
      // This is a SECURITY DEFINER function with unique index enforcement, NOT a standard .insert()
      const { data: appointmentId, error } = await supabase.rpc('book_appointment_atomic', {
        p_user_id: user.id,
        p_clinic_id: clinicId,
        p_doctor_id: formData.doctorId || null,
        p_appointment_date: formData.date,
        p_appointment_time: formData.time,
        p_pet_name: formData.petName,
        p_pet_type: formData.petType,
        p_reason: formData.reason || '',
      });

      if (error) {
        const msg = error.message || '';
        // Handle unique index violation / slot conflict — surface waitlist option
        if (msg.includes('already booked') || msg.includes('unique_violation') || error.code === '23505') {
          setWaitlistPrompt({
            date: formData.date,
            time: formData.time,
            petName: formData.petName,
            petType: formData.petType,
            doctorId: formData.doctorId || '',
            reason: formData.reason || '',
          });
          toast.error('This time slot is already booked.', { description: 'You can join the waitlist to be notified if it opens up.' });
          setIsPending(false);
          return;
        }
        toast.error(msg || 'Failed to book appointment. Please try again.');
        setIsPending(false);
        return;
      }

      // Format date for notifications
      const formattedDate = format(new Date(formData.date), 'MMM d, yyyy');

      // Notify clinic owner about new appointment
      if (clinic && clinicId) {
        const clinicOwnerId = await getClinicOwnerUserId(clinicId);
        if (clinicOwnerId && appointmentId) {
          await createNewAppointmentNotification({
            clinicOwnerId,
            appointmentId,
            clinicId: clinicId,
            clinicName: clinic.name,
            petName: formData.petName,
            petType: formData.petType,
            appointmentDate: formattedDate,
            appointmentTime: formData.time,
          });
        }

        // Send confirmation notification to pet parent
        if (appointmentId) {
          await createAppointmentConfirmationNotification({
            userId: user.id,
            appointmentId,
            clinicName: clinic.name,
            appointmentDate: formattedDate,
            appointmentTime: formData.time,
          });
        }
      }
      
      toast.success('Appointment Booked! You will receive a confirmation soon.');
      navigate('/profile');
    } catch (error: unknown) {
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsPending(false);
    }
  };

  // Show loading state
  if (clinicLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main id="main-content" className="container mx-auto px-4 py-6 flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  // Clinic not found - clinics_public view already filters out blocked clinics
  if (!clinic) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
        <Navbar />
        <main id="main-content" className="container mx-auto px-4 py-6 sm:py-8 max-w-xl flex-1">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 sm:mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
                <Ban className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Clinic Unavailable</h2>
              <p className="text-muted-foreground mb-4">
                This clinic is currently not available. Please try another clinic.
              </p>
              <Button onClick={() => navigate('/clinics')}>
                Browse Other Clinics
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <Navbar />
      <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 max-w-2xl flex-1">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        {/* Clinic Info Card - Compact for mobile */}
        {clinic && (
          <Card className="mb-4 sm:mb-6 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:h-16 rounded-xl flex-shrink-0">
                  <AvatarImage src={clinic.image_url || undefined} />
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-bold">
                    {clinic.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-foreground text-base sm:text-lg leading-tight line-clamp-1">
                        {clinic.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {clinic.is_verified && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            <BadgeCheck className="h-3 w-3 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                        {clinic.rating && (
                          <span className="flex items-center gap-0.5 text-xs text-amber-600">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {clinic.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {clinic.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{clinic.address}</span>
                      </span>
                    )}
                    {clinic.opening_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {clinic.opening_hours}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Waitlist Prompt */}
        {waitlistPrompt && (
          <Card className="mb-4 sm:mb-6 border-warning bg-warning-light">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground">Slot Already Booked</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    The selected time slot ({waitlistPrompt.time} on {waitlistPrompt.date}) is already taken. 
                    Join the waitlist to be notified if it becomes available.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={isJoiningWaitlist}
                      onClick={async () => {
                        if (!user || !clinicId) return;
                        setIsJoiningWaitlist(true);
                        try {
                          const { error } = await supabase.from('appointment_waitlist').insert({
                            user_id: user.id,
                            clinic_id: clinicId,
                            doctor_id: waitlistPrompt.doctorId || null,
                            preferred_date: waitlistPrompt.date,
                            preferred_time: waitlistPrompt.time,
                            pet_name: waitlistPrompt.petName,
                            pet_type: waitlistPrompt.petType,
                            reason: waitlistPrompt.reason || null,
                          });
                          if (error) throw error;
                          toast.success('You have been added to the waitlist!', { description: 'We will notify you when the slot opens up.' });
                          setWaitlistPrompt(null);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : 'Unknown error';
                          toast.error('Failed to join waitlist.', { description: msg });
                        } finally {
                          setIsJoiningWaitlist(false);
                        }
                      }}
                      className="text-xs h-8"
                    >
                      {isJoiningWaitlist ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                      Join Waitlist
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWaitlistPrompt(null)}
                      className="text-xs h-8"
                    >
                      Choose Different Time
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Wizard */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Book Appointment</CardTitle>
            <CardDescription className="text-sm">
              Fill in the details to schedule your visit
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {doctorsLoading ? (
              <div className="flex items-center justify-center py-12" aria-busy="true">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <BookAppointmentWizard
                onSubmit={handleSubmit}
                isPending={isPending}
                doctors={doctorsWithSchedules}
                onCancel={() => navigate(-1)}
                clinicName={clinic?.name}
                clinicId={clinicId}
                preSelectedDoctorId={preSelectedDoctorId || undefined}
              />
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default BookAppointmentPage;
