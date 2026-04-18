import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Star, CheckCircle, AlertCircle,
  Building2, Stethoscope, Package, Plus, Edit,
  BarChart3, ArrowUpRight,
  CalendarDays, UserCheck,
  ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import ClinicAppointmentsList from '@/components/clinic/ClinicAppointmentsList';
import { GlobalSearch } from '@/components/GlobalSearch';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { WalkInAppointmentData } from '@/components/clinic/AddWalkInAppointmentDialog';

// Lazy load heavy components
const ClinicAnalyticsCharts = lazy(() => import('@/components/clinic/ClinicAnalyticsCharts'));
const AddWalkInAppointmentDialog = lazy(() => import('@/components/clinic/AddWalkInAppointmentDialog'));
const QuickStatsOverviewLazy = lazy(() => import('@/components/clinic/QuickStatsOverview'));

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { isClinicOwner, isAdmin, isLoading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('appointments');
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);
  const { 
    ownedClinic, 
    clinicLoading, 
    clinicServices,
    clinicDoctors,
    clinicAppointments,
    updateAppointmentStatus,
    updateClinic,
    addWalkInAppointment
  } = useClinicOwner();

  // Set document title
  useDocumentTitle(ownedClinic?.name ? `${ownedClinic.name} Dashboard` : 'Clinic Dashboard');

  // Memoized data - MUST be before any early returns
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const todayAppointments = useMemo(() =>
    clinicAppointments?.filter((apt: any) => apt.appointment_date === todayStr) || [],
    [clinicAppointments, todayStr]
  );

  const pendingAppointments = useMemo(() =>
    clinicAppointments?.filter((apt: any) => apt.status === 'pending') || [],
    [clinicAppointments]
  );

  const activeDoctors = useMemo(() =>
    clinicDoctors?.filter(d => d.status === 'active') || [],
    [clinicDoctors]
  );

  // Toggle clinic open/close status
  const handleToggleOpen = async () => {
    if (!ownedClinic) return;
    setIsTogglingOpen(true);
    try {
      await updateClinic.mutateAsync({ is_open: !ownedClinic.is_open });
      toast.success(ownedClinic.is_open ? 'Clinic is now closed' : 'Clinic is now open');
    } catch (error) {
      toast.error('Failed to update clinic status');
    } finally {
      setIsTogglingOpen(false);
    }
  };

  // Set up realtime subscription for appointments, doctors, and services
  useEffect(() => {
    if (!ownedClinic?.id) return;

    const channel = supabase
      .channel(`clinic-appointments-${ownedClinic.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `clinic_id=eq.${ownedClinic.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['clinic-appointments', ownedClinic.id] });
          if (payload.eventType === 'INSERT') {
            toast.info('📅 New appointment received!', {
              description: 'Check your appointments tab',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clinic_doctors',
          filter: `clinic_id=eq.${ownedClinic.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clinic-doctors-list', ownedClinic.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clinic_services',
          filter: `clinic_id=eq.${ownedClinic.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clinic-services', ownedClinic.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownedClinic?.id, queryClient]);

  // Redirect to verification page if not verified
  useEffect(() => {
    if (ownedClinic && !ownedClinic.is_verified && ownedClinic.verification_status !== 'approved') {
      navigate('/clinic/verification');
    }
  }, [ownedClinic, navigate]);

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/30 via-background to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  // Auth/role guard handled by RequireClinicOwner wrapper in App.tsx

  // Clinic owner but no clinic found - redirect to create one
  if ((isClinicOwner || isAdmin) && !ownedClinic && !clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/30 via-background to-background p-4">
        <Card className="max-w-md w-full shadow-xl border-border/50">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Set Up Your Clinic</h2>
            <p className="text-muted-foreground mb-6">
              Your clinic profile needs to be set up. Please complete the registration.
            </p>
            <Button onClick={() => navigate('/clinic/verification')} size="lg">
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }




  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-background to-background pb-20 md:pb-0">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Enhanced Hero Section */}
        <div className="bg-gradient-to-br from-white via-white to-primary/5 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-5 lg:p-6 xl:p-8 shadow-lg shadow-black/5 border border-border/50 mb-4 sm:mb-6 lg:mb-8 relative overflow-hidden">
          {/* Decorative accent */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative flex flex-col gap-4">
            {/* Top Row: Avatar, Name, Status */}
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 border-2 sm:border-4 border-primary/10 shadow-lg flex-shrink-0 ring-2 ring-background">
                  <AvatarImage src={ownedClinic?.image_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-orange-400 text-white text-lg sm:text-xl">
                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5 sm:mb-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-display font-bold text-foreground truncate">
                      {ownedClinic?.name || 'My Clinic'}
                    </h1>
                    {ownedClinic?.is_verified && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-500 gap-1 text-xs flex-shrink-0">
                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span className="hidden xs:inline">Verified</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[300px]">
                    {ownedClinic?.address || 'Add your address'}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                    {/* Open/Close Toggle */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ownedClinic?.is_open ?? false}
                        onCheckedChange={handleToggleOpen}
                        disabled={isTogglingOpen}
                        aria-label="Toggle clinic open/closed status"
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <Badge 
                        variant={ownedClinic?.is_open ? 'default' : 'secondary'} 
                        className={cn(
                          "text-[10px] sm:text-xs transition-colors",
                          ownedClinic?.is_open ? 'bg-emerald-500 hover:bg-emerald-500' : ''
                        )}
                      >
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full mr-1 sm:mr-1.5",
                          ownedClinic?.is_open ? 'bg-white animate-pulse' : 'bg-muted-foreground'
                        )} />
                        {ownedClinic?.is_open ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-amber-500" />
                      {ownedClinic?.rating || 4.5}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Desktop-only search in header */}
              <div className="hidden lg:block w-56">
                <GlobalSearch variant="clinic" className="w-full h-10" placeholder="Search appointments..." />
              </div>
            </div>
            
            {/* Mobile Search Bar - Full Width */}
            <div className="lg:hidden w-full">
              <GlobalSearch variant="clinic" className="w-full h-10" placeholder="Search appointments..." />
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
              {/* Add Appointment - Primary CTA */}
              <Button
                onClick={() => setIsAddAppointmentOpen(true)}
                className="rounded-lg sm:rounded-xl min-h-[44px] h-11 sm:h-10 px-4 gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-transform flex-1 sm:flex-none order-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Walk-in</span>
              </Button>
              
              <div className="flex gap-2 sm:gap-3 order-2">
                {/* View Public Profile Button */}
                <Button
                  variant="outline"
                  className="rounded-lg sm:rounded-xl min-h-[44px] h-11 sm:h-10 px-3 sm:px-4 active:scale-95 transition-transform flex-1 sm:flex-none"
                  onClick={() => ownedClinic?.id && navigate(`/clinic/${ownedClinic.id}`)}
                  disabled={!ownedClinic?.id}
                >
                  <ExternalLink className="h-4 w-4 sm:mr-2" />
                  <span className="sm:inline">View Public</span>
                </Button>
                
                <Button 
                  asChild 
                  variant="secondary"
                  className="rounded-lg sm:rounded-xl min-h-[44px] h-11 sm:h-10 px-3 sm:px-4 active:scale-95 transition-transform flex-1 sm:flex-none"
                >
                  <Link to="/clinic/profile">
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="sm:inline">Edit Profile</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Walk-in Appointment Dialog - only mount when opened */}
        {isAddAppointmentOpen && (
          <Suspense fallback={null}>
            <AddWalkInAppointmentDialog
              open={isAddAppointmentOpen}
              onOpenChange={setIsAddAppointmentOpen}
              doctors={clinicDoctors || []}
              onSubmit={async (data: WalkInAppointmentData) => {
                await addWalkInAppointment.mutateAsync(data);
                setIsAddAppointmentOpen(false);
              }}
              isSubmitting={addWalkInAppointment.isPending}
            />
          </Suspense>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <Card 
            onClick={() => setActiveTab('appointments')}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 border-border/50 bg-white active:scale-[0.98]",
              activeTab === 'appointments' && "ring-2 ring-primary shadow-xl shadow-primary/10"
            )}
          >
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-orange-100 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
                </div>
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{todayAppointments.length}</p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Today's Appts</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveTab('appointments')}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 border-border/50 bg-white active:scale-[0.98]",
              activeTab === 'appointments' && pendingAppointments.length > 0 && "ring-2 ring-amber-500 shadow-xl"
            )}
          >
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-amber-600" />
                </div>
                {pendingAppointments.length > 0 && (
                  <Badge className="bg-amber-500 hover:bg-amber-500 animate-pulse text-[10px] sm:text-xs">Action</Badge>
                )}
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{pendingAppointments.length}</p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveTab('doctors')}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 border-border/50 bg-white active:scale-[0.98]",
              activeTab === 'doctors' && "ring-2 ring-emerald-500 shadow-xl"
            )}
          >
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-emerald-600" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{activeDoctors.length}</p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Doctors</p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveTab('services')}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 border-border/50 bg-white active:scale-[0.98]",
              activeTab === 'services' && "ring-2 ring-blue-500 shadow-xl"
            )}
          >
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-600" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{clinicServices?.length || 0}</p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Services</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="bg-white border border-border/50 rounded-lg sm:rounded-xl p-1 sm:p-1.5 h-auto inline-flex w-auto min-w-full sm:w-full shadow-sm">
              <TabsTrigger value="appointments" className="rounded-md sm:rounded-lg data-[state=active]:shadow-sm px-2.5 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm whitespace-nowrap flex-1">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Appointments</span>
                <span className="xs:hidden">Appts</span>
              </TabsTrigger>
              <TabsTrigger value="doctors" className="rounded-md sm:rounded-lg data-[state=active]:shadow-sm px-2.5 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm whitespace-nowrap flex-1">
                <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Doctors
              </TabsTrigger>
              <TabsTrigger value="services" className="rounded-md sm:rounded-lg data-[state=active]:shadow-sm px-2.5 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm whitespace-nowrap flex-1">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-md sm:rounded-lg data-[state=active]:shadow-sm px-2.5 sm:px-4 lg:px-6 py-2 text-xs sm:text-sm whitespace-nowrap flex-1">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Suspense fallback={<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3"><div className="h-24 bg-muted animate-pulse rounded-lg" /><div className="h-24 bg-muted animate-pulse rounded-lg" /><div className="h-24 bg-muted animate-pulse rounded-lg" /><div className="h-24 bg-muted animate-pulse rounded-lg" /></div>}>
              <QuickStatsOverviewLazy 
                appointments={clinicAppointments || []}
                doctorsCount={activeDoctors.length}
                servicesCount={clinicServices?.length || 0}
              />
            </Suspense>
            
            <Card className="bg-white border-border/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">All Appointments</CardTitle>
                  <CardDescription>Manage and review clinic appointments</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ClinicAppointmentsList 
                  appointments={clinicAppointments || []}
                  onStatusChange={(id, status) => updateAppointmentStatus.mutate({ id, status })}
                  isUpdating={updateAppointmentStatus.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-6">
            <Card className="bg-white border-border/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Clinic Doctors</CardTitle>
                  <CardDescription>Manage doctors at your clinic</CardDescription>
                </div>
                <Button asChild className="rounded-xl shadow-lg shadow-primary/25">
                  <Link to="/clinic/doctors">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doctor
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {clinicDoctors && clinicDoctors.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {clinicDoctors.map((cd) => (
                      <div 
                        key={cd.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                          <AvatarImage src={cd.doctor?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Stethoscope className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{cd.doctor?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {cd.doctor?.specialization || 'General Veterinarian'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={cd.doctor?.is_available ? 'default' : 'secondary'}
                              className={cd.doctor?.is_available ? 'bg-emerald-500 hover:bg-emerald-500' : ''}
                            >
                              {cd.doctor?.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">No doctors added yet</h3>
                    <p className="text-muted-foreground mb-6">Add doctors to start accepting appointments</p>
                    <Button asChild className="rounded-xl">
                      <Link to="/clinic/doctors">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Doctor
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card className="bg-white border-border/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Clinic Services</CardTitle>
                  <CardDescription>Services offered at your clinic</CardDescription>
                </div>
                <Button asChild className="rounded-xl shadow-lg shadow-primary/25">
                  <Link to="/clinic/services">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {clinicServices && clinicServices.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {clinicServices.map((service) => (
                      <div 
                        key={service.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{service.name}</p>
                            {service.duration_minutes && (
                              <p className="text-sm text-muted-foreground">
                                {service.duration_minutes} mins
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {service.price && (
                            <p className="font-bold text-primary">৳{service.price}</p>
                          )}
                          <Badge variant={service.is_active ? 'default' : 'secondary'} className="mt-1">
                            {service.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">No services added yet</h3>
                    <p className="text-muted-foreground mb-6">Add services to show what you offer</p>
                    <Button asChild className="rounded-xl">
                      <Link to="/clinic/services">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Service
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <ClinicAnalyticsCharts
                appointments={clinicAppointments || []}
                services={clinicServices || []}
                doctors={clinicDoctors || []}
                clinicRating={ownedClinic?.rating}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default ClinicDashboard;
