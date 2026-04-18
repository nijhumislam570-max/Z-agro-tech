import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, MapPin, ShoppingBag, Calendar, Edit2, Save, X, Loader2, Package, PawPrint, Plus, Heart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { profileSchema } from '@/lib/validations';
import { getDivisions, getDistricts, getThanas } from '@/lib/bangladeshRegions';
import ProfileHeader from '@/components/profile/ProfileHeader';
import MyPetsSection from '@/components/profile/MyPetsSection';
import OrderCard from '@/components/profile/OrderCard';
import AppointmentCard from '@/components/profile/AppointmentCard';
import { useAppointmentActions } from '@/hooks/useAppointments';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  division: string | null;
  district: string | null;
  thana: string | null;
  avatar_url?: string | null;
  cover_photo_url?: string | null;
}

interface Order {
  id: string;
  items: any;
  total_amount: number;
  status: string;
  shipping_address: string | null;
  created_at: string;
  tracking_id?: string | null;
  rejection_reason?: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string | null;
  pet_type: string | null;
  reason: string | null;
  status: string;
  clinic_id: string;
  clinic?: {
    name: string;
    address: string | null;
    phone: string | null;
  };
}

const ProfilePage = () => {
  useDocumentTitle('My Profile');
  const { user, loading: authLoading } = useAuth();
  const { pets, loading: petsLoading } = usePets();
  const { isAdmin } = useAdmin();
  const { isClinicOwner, isDoctor } = useUserRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { cancelAppointment } = useAppointmentActions();
  const queryClient = useQueryClient();
  
  // URL-controlled tab
  const activeTab = searchParams.get('tab') || 'profile';
  const setActiveTab = useCallback((tab: string) => {
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    division: '',
    district: '',
    thana: '',
  });

  // Parallel data fetching with React Query caching
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, address, division, district, thana, avatar_url, cover_photo_url')
        .eq('user_id', user!.id)
        .single();
      return data as Profile | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, items, total_amount, status, created_at, shipping_address, payment_method, tracking_id, rejection_reason')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return (data || []) as Order[];
    },
    enabled: !!user?.id && activeTab === 'orders',
    staleTime: 1000 * 60 * 2,
  });

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['user-appointments', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(name, address, phone)
        `)
        .eq('user_id', user!.id)
        .order('appointment_date', { ascending: true });
      return (data || []) as Appointment[];
    },
    enabled: !!user?.id && activeTab === 'appointments',
    staleTime: 1000 * 60 * 2,
  });

  const profile = profileData || null;
  const orders = ordersData || [];
  const appointments = appointmentsData || [];
  const loading = profileLoading;

  // Sync form data when profile loads
  useEffect(() => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        division: profileData.division || '',
        district: profileData.district || '',
        thana: profileData.thana || '',
      });
    }
  }, [profileData]);

  // Auth guard handled by RequireAuth wrapper in App.tsx

  // Real-time order status updates
  useEffect(() => {
    if (!user) return;

    const ordersChannel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          queryClient.setQueryData<Order[]>(
            ['user-orders', user.id],
            (old) => old?.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)) || []
          );
        }
      )
      .subscribe();

    const appointmentsChannel = supabase
      .channel(`user-appointments-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-appointments', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(appointmentsChannel);
    };
  }, [user, queryClient]);

  const handleSave = useCallback(async () => {
    if (!user || !profile) return;
    
    const validationResult = profileSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(', ');
      toast.error(errorMessages);
      return;
    }
    
    setSaving(true);
    try {
      const validatedData = validationResult.data;
      const { error } = await supabase
        .from('profiles')
        .update(validatedData)
        .eq('user_id', user.id);

      if (error) throw error;

      queryClient.setQueryData<Profile | null>(
        ['user-profile', user.id],
        (old) => old ? { ...old, ...validatedData } : null
      );
      setEditing(false);
      toast.success("Profile updated successfully.");
    } catch (error: unknown) {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [user, profile, formData, queryClient]);

  const handleAvatarUpdate = useCallback((url: string) => {
    if (user) {
      queryClient.setQueryData<Profile | null>(
        ['user-profile', user.id],
        (old) => old ? { ...old, avatar_url: url } : null
      );
    }
  }, [user, queryClient]);

  const handleCoverUpdate = useCallback((url: string) => {
    if (user) {
      queryClient.setQueryData<Profile | null>(
        ['user-profile', user.id],
        (old) => old ? { ...old, cover_photo_url: url } : null
      );
    }
  }, [user, queryClient]);

  const handleEditClick = useCallback(() => setEditing(true), []);
  const handleCancelEdit = useCallback(() => setEditing(false), []);

  const divisions = getDivisions();
  const districts = formData.division ? getDistricts(formData.division) : [];
  const thanas = formData.division && formData.district ? getThanas(formData.division, formData.district) : [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" aria-busy="true" aria-label="Loading profile">
        <Loader2 className="h-8 w-8 animate-spin text-primary transform-gpu" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8" role="main" aria-label="User profile">
        {/* Profile Header */}
        {user && (
          <ProfileHeader
            user={{ id: user.id, email: user.email, created_at: user.created_at }}
            profile={profile}
            petsCount={pets.length}
            ordersCount={orders.length}
            appointmentsCount={appointments.length}
            isAdmin={isAdmin}
            isClinicOwner={isClinicOwner}
            isDoctor={isDoctor}
            onAvatarUpdate={handleAvatarUpdate}
            onCoverUpdate={handleCoverUpdate}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="w-full bg-white border border-border/50 rounded-xl p-1 h-auto grid grid-cols-4 gap-1" aria-label="Profile sections">
            <TabsTrigger 
              value="profile" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              aria-label="Profile information"
            >
              <User className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pets" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              aria-label="My pets"
            >
              <PawPrint className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>Pets</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              aria-label="My orders"
            >
              <ShoppingBag className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appointments" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              aria-label="My appointments"
            >
              <Calendar className="h-4 w-4 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="hidden xs:inline">Appts</span>
              <span className="xs:hidden">Appt</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2" role="region" aria-labelledby="account-info-heading">
              <Card className="shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg" id="account-info-heading">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    Account Info
                  </CardTitle>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={handleEditClick} className="h-8 sm:h-9 gap-1.5" aria-label="Edit profile">
                      <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-8 sm:h-9 px-2.5" aria-label="Cancel editing">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 sm:h-9 gap-1.5" aria-label="Save changes">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin transform-gpu" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                        <span className="hidden sm:inline">Save</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                    <p className="text-sm sm:text-base text-foreground font-medium truncate">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</label>
                    {editing ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value.slice(0, 100) })}
                        placeholder="Enter your full name"
                        maxLength={100}
                        className="h-10 text-sm"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground font-medium">{profile?.full_name || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</label>
                    {editing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.slice(0, 20) })}
                        placeholder="Enter your phone number"
                        maxLength={20}
                        className="h-10 text-sm"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground font-medium">{profile?.phone || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 sm:p-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg" id="saved-address-heading">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center" aria-hidden="true">
                      <MapPin className="h-4 w-4 text-accent" />
                    </div>
                    Saved Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Street Address</label>
                    {editing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 500) })}
                        placeholder="Enter your address"
                        maxLength={500}
                        className="h-10"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground font-medium">{profile?.address || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Division</label>
                      {editing ? (
                        <Select
                          value={formData.division}
                          onValueChange={(value) => setFormData({ ...formData, division: value, district: '', thana: '' })}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select Division" />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.map((div) => (
                              <SelectItem key={div} value={div}>{div}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm sm:text-base text-foreground font-medium">{profile?.division || <span className="text-muted-foreground">-</span>}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">District</label>
                      {editing ? (
                        <Select
                          value={formData.district}
                          onValueChange={(value) => setFormData({ ...formData, district: value, thana: '' })}
                          disabled={!formData.division}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((dist) => (
                              <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm sm:text-base text-foreground font-medium">{profile?.district || <span className="text-muted-foreground">-</span>}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thana</label>
                      {editing ? (
                        <Select
                          value={formData.thana}
                          onValueChange={(value) => setFormData({ ...formData, thana: value })}
                          disabled={!formData.district}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select Thana" />
                          </SelectTrigger>
                          <SelectContent>
                            {thanas.map((thana) => (
                              <SelectItem key={thana} value={thana}>{thana}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm sm:text-base text-foreground font-medium">{profile?.thana || <span className="text-muted-foreground">-</span>}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Pets Tab */}
          <TabsContent value="pets">
            <MyPetsSection pets={pets} loading={petsLoading} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/30 p-4 sm:p-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-8 w-8 rounded-lg bg-coral/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-coral" />
                  </div>
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary transform-gpu" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">No orders yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here</p>
                    <Button onClick={() => navigate('/shop')} className="gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-4 sm:p-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  My Appointments
                </CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/wishlist')} 
                    className="gap-1.5 h-9 flex-1 sm:flex-none"
                    aria-label="View Wishlist"
                  >
                    <Heart className="h-4 w-4 text-destructive" />
                    <span className="hidden sm:inline">Wishlist</span>
                  </Button>
                  <Button onClick={() => navigate('/clinics')} className="gap-2 flex-1 sm:flex-none h-9">
                    <Plus className="h-4 w-4" />
                    Book New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {appointmentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary transform-gpu" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">No appointments scheduled</h3>
                    <p className="text-sm text-muted-foreground mb-4">Book an appointment at a nearby clinic</p>
                    <Button onClick={() => navigate('/clinics')} className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Find a Clinic
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {appointments.map((appointment) => (
                      <AppointmentCard 
                        key={appointment.id} 
                        appointment={appointment}
                        onCancel={(id, clinicId, clinicName) => 
                          cancelAppointment.mutate({ appointmentId: id, clinicId, clinicName })
                        }
                        isCancelling={cancelAppointment.isPending}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default ProfilePage;
