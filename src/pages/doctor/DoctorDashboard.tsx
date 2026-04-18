import { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Users, Star, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Settings,
  Building2, ArrowLeft, Stethoscope, Search, Bell, Mail,
  ExternalLink, Shield, CheckCircle2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctor } from '@/hooks/useDoctor';
import { useUserRole } from '@/hooks/useUserRole';
import { ClinicBrowser } from '@/components/doctor/ClinicBrowser';
import { DoctorInvitationsTab } from '@/components/doctor/DoctorInvitationsTab';
import { StatCard } from '@/components/admin/StatCard';

const DoctorScheduleManager = lazy(() => import('@/components/doctor/DoctorScheduleManager').then(m => ({ default: m.DoctorScheduleManager })));
import { useDoctorJoinRequests } from '@/hooks/useDoctorJoinRequests';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DoctorDashboard = () => {
  useDocumentTitle('Doctor Dashboard');
  const [activeTab, setActiveTab] = useState('appointments');
  
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const { 
    doctorProfile, 
    profileLoading, 
    clinicAffiliations,
    doctorAppointments,
    updateAppointmentStatus 
  } = useDoctor();

  const { pendingInvitations } = useDoctorJoinRequests(doctorProfile?.id);

  // Realtime subscription for appointments
  useEffect(() => {
    if (!doctorProfile?.id) return;

    const channel = supabase
      .channel(`doctor-appointments-${doctorProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${doctorProfile.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['doctor-appointments', doctorProfile.id] });
          if (payload.eventType === 'INSERT') {
            toast.info('📅 New appointment received!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorProfile?.id, queryClient]);

  if (roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This page is only accessible to veterinary doctors.
            </p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayAppointments = doctorAppointments?.filter(
    apt => apt.appointment_date === format(new Date(), 'yyyy-MM-dd')
  ) || [];

  const pendingAppointments = doctorAppointments?.filter(
    apt => apt.status === 'pending'
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getVerificationBanner = () => {
    if (!doctorProfile) return null;

    if (doctorProfile.is_verified) {
      return (
        <Alert className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-400">Verified Doctor</AlertTitle>
          <AlertDescription className="text-emerald-700 dark:text-emerald-500">
            Your credentials have been verified. You are listed on the public doctors directory.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-400">Verification Pending</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>Complete your verification to be listed on the public doctors directory.</span>
          <Button size="sm" variant="outline" className="w-fit" asChild>
            <Link to="/doctor/verification">Complete Verification</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  const statCards = [
    {
      label: "Today's Appts",
      value: todayAppointments.length,
      icon: Calendar,
      colorClass: 'bg-primary/10 text-primary',
      tab: 'appointments',
    },
    {
      label: 'Pending',
      value: pendingAppointments.length,
      icon: Clock,
      colorClass: 'bg-yellow-500/10 text-yellow-600',
      tab: 'appointments',
    },
    {
      label: 'Total Appointments',
      value: doctorAppointments?.length || 0,
      icon: Users,
      colorClass: 'bg-green-500/10 text-green-600',
      tab: 'appointments',
    },
    {
      label: 'Affiliations',
      value: clinicAffiliations?.length || 0,
      icon: Building2,
      colorClass: 'bg-blue-500/10 text-blue-600',
      tab: 'clinics',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Welcome Hero Section */}
        <div className="bg-gradient-to-br from-white via-white to-primary/5 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 shadow-lg shadow-black/5 border border-border/50 mb-4 sm:mb-6 lg:mb-8 relative overflow-hidden">
          {/* Decorative accent */}
          <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 relative z-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 border-2 border-primary/20">
                <AvatarImage src={doctorProfile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {doctorProfile?.name?.charAt(0) || 'D'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    Welcome, Dr. {doctorProfile?.name?.split(' ')[0] || 'Doctor'}
                  </h1>
                  {doctorProfile?.is_verified && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-0.5 sm:mt-1">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/doctor/profile">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              {doctorProfile?.id && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/doctor/${doctorProfile.id}`)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="mb-4 sm:mb-6">
          {getVerificationBanner()}
        </div>

        {/* Stats Grid - Clickable Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <StatCard
                key={stat.label}
                title={stat.label}
                value={stat.value}
                icon={<Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.colorClass.split(' ')[1]}`} />}
                iconClassName={stat.colorClass.split(' ')[0]}
                onClick={() => setActiveTab(stat.tab)}
                active={activeTab === stat.tab}
              />
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:max-w-2xl sm:grid-cols-5 h-auto p-1 gap-1">
              <TabsTrigger value="appointments" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Appointments</TabsTrigger>
              <TabsTrigger value="clinics" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">My Clinics</TabsTrigger>
              <TabsTrigger value="invitations" className="relative text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                Invitations
                {pendingInvitations && pendingInvitations.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-warning text-warning-foreground">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="find-clinics" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Find Clinics</TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap">Schedule</TabsTrigger>
            </TabsList>
          </div>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Manage your patient appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {doctorAppointments && doctorAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {doctorAppointments.slice(0, 10).map((apt: any) => (
                      <div 
                        key={apt.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{apt.pet_name || 'Unknown Pet'}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {apt.pet_type} • {apt.reason || 'General Checkup'}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {format(new Date(apt.appointment_date), 'MMM d, yyyy')} at {apt.appointment_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                          {apt.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-9 w-9 sm:h-10 sm:w-10 p-0 text-green-600 hover:bg-green-50"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  appointmentId: apt.id, 
                                  status: 'confirmed' 
                                })}
                                aria-label="Confirm appointment"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-9 w-9 sm:h-10 sm:w-10 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  appointmentId: apt.id, 
                                  status: 'cancelled' 
                                })}
                                aria-label="Cancel appointment"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {apt.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-9 sm:h-10 min-w-[44px] text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                              onClick={() => updateAppointmentStatus.mutate({ 
                                appointmentId: apt.id, 
                                status: 'completed' 
                              })}
                              disabled={updateAppointmentStatus.isPending}
                              aria-label="Mark as completed"
                            >
                              {updateAppointmentStatus.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Complete</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No appointments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Clinics Tab */}
          <TabsContent value="clinics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Affiliated Clinics</CardTitle>
                <CardDescription>Clinics where you practice</CardDescription>
              </CardHeader>
              <CardContent>
                {clinicAffiliations && clinicAffiliations.length > 0 ? (
                  <div className="space-y-4">
                    {clinicAffiliations.map((affiliation) => (
                      <div 
                        key={affiliation.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/clinic/${affiliation.clinic?.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={affiliation.clinic?.image_url || ''} />
                            <AvatarFallback>
                              <Building2 className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{affiliation.clinic?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {affiliation.clinic?.address}
                            </p>
                          </div>
                        </div>
                        <Badge variant={affiliation.status === 'active' ? 'default' : 'secondary'}>
                          {affiliation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Not affiliated with any clinic yet</p>
                    <p className="text-sm text-muted-foreground">Go to "Find Clinics" tab to browse and join clinics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-4">
            {doctorProfile?.id ? (
              <DoctorInvitationsTab doctorId={doctorProfile.id} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Complete your profile to view invitations</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Find Clinics Tab */}
          <TabsContent value="find-clinics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Browse Clinics
                </CardTitle>
                <CardDescription>Find and request to join verified clinics</CardDescription>
              </CardHeader>
              <CardContent>
                {doctorProfile?.id ? (
                  <ClinicBrowser doctorId={doctorProfile.id} />
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Complete your profile to browse clinics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            {doctorProfile?.id && clinicAffiliations ? (
              <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <DoctorScheduleManager 
                  doctorId={doctorProfile.id} 
                  clinicAffiliations={clinicAffiliations} 
                />
              </Suspense>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {!doctorProfile?.id 
                      ? 'Complete your profile to manage your schedule'
                      : 'Join a clinic first to set up your schedule'
                    }
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/doctor/profile">Update Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default DoctorDashboard;
