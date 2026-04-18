import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Loader2, Stethoscope, Mail, Phone, Edit, Trash2, 
  GraduationCap, BadgeDollarSign, ChevronLeft,
  UserPlus, X, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useUserRole } from '@/hooks/useUserRole';
import { useClinicOwner, type ClinicDoctor } from '@/hooks/useClinicOwner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useIsMobile } from '@/hooks/use-mobile';
import AddDoctorWizard from '@/components/clinic/AddDoctorWizard';
import { JoinRequestsTab } from '@/components/clinic/JoinRequestsTab';
import { InviteDoctorDialog } from '@/components/clinic/InviteDoctorDialog';
import { cn } from '@/lib/utils';

// Lazy-load DoctorScheduleManager to avoid blocking initial render
const DoctorScheduleManager = lazy(() => import('@/components/clinic/DoctorScheduleManager'));

// Skeleton loader for doctor cards
const DoctorCardSkeleton = () => (
  <Card className="bg-white border-border/50 shadow-sm">
    <CardContent className="p-5">
      <div className="flex gap-4">
        <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-3 mt-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-40 mt-2" />
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  license_number: string;
  qualifications: string;
  experience_years: string;
  consultation_fee: string;
  bio: string;
  avatar_url: string;
}

const initialFormData: DoctorFormData = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  license_number: '',
  qualifications: '',
  experience_years: '',
  consultation_fee: '',
  bio: '',
  avatar_url: '',
};

const ClinicDoctors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isClinicOwner, isAdmin, isLoading: roleLoading } = useUserRole();
  const { 
    ownedClinic,
    clinicLoading, 
    clinicDoctors, 
    doctorsLoading,
    updateDoctorStatus,
    addDoctor,
    updateDoctor,
    removeDoctor,
  } = useClinicOwner();

  // Set document title
  useDocumentTitle('Manage Doctors');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>(initialFormData);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  // Get existing doctor IDs to filter out from invite list
  const existingDoctorIds = clinicDoctors?.map(cd => cd.doctor_id) || [];

  // Memoize doctor list for DoctorScheduleManager to prevent re-renders
  const scheduleDoctors = useMemo(() => {
    return (clinicDoctors || [])
      .filter(cd => cd.status === 'active' && cd.doctor)
      .map(cd => ({ id: cd.doctor_id, name: cd.doctor!.name }));
  }, [clinicDoctors]);

  const handleInputChange = (field: keyof DoctorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const qualificationsArray = formData.qualifications
      .split(',')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    await addDoctor.mutateAsync({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      specialization: formData.specialization || null,
      license_number: formData.license_number || null,
      qualifications: qualificationsArray.length > 0 ? qualificationsArray : null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
      bio: formData.bio || null,
      avatar_url: formData.avatar_url || null,
    });

    setIsAddOpen(false);
    setFormData(initialFormData);
  };

  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctorId) return;

    const qualificationsArray = formData.qualifications
      .split(',')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    await updateDoctor.mutateAsync({
      doctorId: editingDoctorId,
      updates: {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        license_number: formData.license_number || null,
        qualifications: qualificationsArray.length > 0 ? qualificationsArray : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        bio: formData.bio || null,
      },
    });

    setIsEditOpen(false);
    setFormData(initialFormData);
    setEditingDoctorId(null);
  };

  const openEditDialog = (doctor: ClinicDoctor['doctor']) => {
    if (!doctor) return;
    setEditingDoctorId(doctor.id);
    setFormData({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || '',
      license_number: doctor.license_number || '',
      qualifications: doctor.qualifications?.join(', ') || '',
      experience_years: doctor.experience_years?.toString() || '',
      consultation_fee: doctor.consultation_fee?.toString() || '',
      bio: doctor.bio || '',
      avatar_url: doctor.avatar_url || '',
    });
    setIsEditOpen(true);
  };

  const handleDeleteDoctor = async () => {
    if (!deleteConfirm) return;
    await removeDoctor.mutateAsync(deleteConfirm);
    setDeleteConfirm(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateDoctorStatus.mutateAsync({ id, status });
  };

  // Auth/role guard handled by RequireClinicOwner wrapper in App.tsx

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/30 via-background to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading doctors...</p>
        </div>
      </div>
    );
  }

  const DoctorForm = ({ onSubmit, submitLabel, isPending }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string; isPending: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Doctor Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            placeholder="Dr. John Doe"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Select value={formData.specialization} onValueChange={(v) => handleInputChange('specialization', v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General Veterinarian">General Veterinarian</SelectItem>
              <SelectItem value="Surgery">Surgery</SelectItem>
              <SelectItem value="Dermatology">Dermatology</SelectItem>
              <SelectItem value="Cardiology">Cardiology</SelectItem>
              <SelectItem value="Orthopedics">Orthopedics</SelectItem>
              <SelectItem value="Dentistry">Dentistry</SelectItem>
              <SelectItem value="Oncology">Oncology</SelectItem>
              <SelectItem value="Neurology">Neurology</SelectItem>
              <SelectItem value="Emergency Care">Emergency Care</SelectItem>
              <SelectItem value="Exotic Animals">Exotic Animals</SelectItem>
              <SelectItem value="Farm Animals">Farm Animals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="doctor@example.com"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+880 1XXX-XXXXXX"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="license">License Number</Label>
          <Input
            id="license"
            value={formData.license_number}
            onChange={(e) => handleInputChange('license_number', e.target.value)}
            placeholder="VET-XXXX-XXXX"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience">Experience (years)</Label>
          <Input
            id="experience"
            type="number"
            min="0"
            value={formData.experience_years}
            onChange={(e) => handleInputChange('experience_years', e.target.value)}
            placeholder="5"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="qualifications">Qualifications (comma-separated)</Label>
          <Input
            id="qualifications"
            value={formData.qualifications}
            onChange={(e) => handleInputChange('qualifications', e.target.value)}
            placeholder="DVM, MS, PhD"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">Consultation Fee (৳)</Label>
          <Input
            id="fee"
            type="number"
            min="0"
            value={formData.consultation_fee}
            onChange={(e) => handleInputChange('consultation_fee', e.target.value)}
            placeholder="500"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Brief description about the doctor..."
          rows={3}
          className="rounded-xl resize-none"
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="submit" disabled={isPending} className="rounded-xl">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-background to-background pb-20 md:pb-0">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl"
              onClick={() => navigate('/clinic/dashboard')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Manage Doctors</h1>
              <p className="text-sm text-muted-foreground">Add and manage doctors at your clinic</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 rounded-xl"
              onClick={() => setIsInviteOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invite Doctor</span>
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-lg shadow-primary/25">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Doctor</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Doctor</DialogTitle>
                  <DialogDescription>
                    Create a doctor profile for {ownedClinic?.name}
                  </DialogDescription>
                </DialogHeader>
                <AddDoctorWizard 
                  onSubmit={async (data) => {
                    await addDoctor.mutateAsync(data);
                    setIsAddOpen(false);
                  }}
                  isPending={addDoctor.isPending}
                  clinicName={ownedClinic?.name}
                  onCancel={() => setIsAddOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Invite Doctor Dialog */}
          {ownedClinic?.id && (
            <InviteDoctorDialog
              open={isInviteOpen}
              onOpenChange={setIsInviteOpen}
              clinicId={ownedClinic.id}
              clinicName={ownedClinic.name}
              existingDoctorIds={existingDoctorIds}
            />
          )}
        </div>

        {/* Tabs for Doctors and Join Requests */}
        <Tabs defaultValue="doctors" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="doctors" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              My Doctors
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Clock className="h-4 w-4" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctors">

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setFormData(initialFormData);
            setEditingDoctorId(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Doctor</DialogTitle>
              <DialogDescription>
                Update doctor information
              </DialogDescription>
            </DialogHeader>
            <DoctorForm 
              onSubmit={handleEditDoctor} 
              submitLabel="Save Changes" 
              isPending={updateDoctor.isPending} 
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Doctor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the doctor from your clinic. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDoctor} className="bg-destructive text-destructive-foreground rounded-xl">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {doctorsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>
        ) : clinicDoctors && clinicDoctors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {clinicDoctors.map((cd) => (
              <Card key={cd.id} className="bg-white border-border/50 shadow-sm hover:shadow-lg transition-all rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  {/* Top: Avatar + Info + Badge */}
                  <div className="flex gap-3 sm:gap-4">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/10 shadow-md flex-shrink-0">
                      <AvatarImage src={cd.doctor?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-orange-100 text-primary">
                        <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-foreground text-base sm:text-lg truncate">{cd.doctor?.name}</h3>
                          <p className="text-primary font-medium text-sm">
                            {cd.doctor?.specialization || 'General Veterinarian'}
                          </p>
                        </div>
                        <Badge 
                          variant={cd.doctor?.is_available ? 'default' : 'secondary'}
                          className={cn(
                            "flex-shrink-0 text-xs",
                            cd.doctor?.is_available ? 'bg-emerald-500 hover:bg-emerald-500' : ''
                          )}
                        >
                          {cd.doctor?.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      
                      {/* Qualifications & Fee inline */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        {cd.doctor?.qualifications && cd.doctor.qualifications.length > 0 && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <GraduationCap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            {cd.doctor.qualifications.slice(0, 2).join(', ')}
                          </span>
                        )}
                        {cd.doctor?.consultation_fee && (
                          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                            <BadgeDollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                            ৳{cd.doctor.consultation_fee}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Actions row — full width, evenly spaced */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                    <Select
                      value={cd.status}
                      onValueChange={(value) => handleStatusChange(cd.id, value)}
                    >
                      <SelectTrigger className="h-11 min-h-[44px] rounded-xl text-sm font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      className="h-11 min-h-[44px] rounded-xl text-sm font-medium active:scale-95 transition-transform"
                      onClick={() => openEditDialog(cd.doctor)}
                    >
                      <Edit className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-11 min-h-[44px] rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 active:scale-95 transition-transform"
                      onClick={() => setDeleteConfirm(cd.doctor_id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No doctors yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add doctors to your clinic to start accepting appointments
              </p>
              <Button onClick={() => setIsAddOpen(true)} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Doctor
              </Button>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules">
            {ownedClinic?.id && scheduleDoctors.length > 0 ? (
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                <DoctorScheduleManager 
                  clinicId={ownedClinic.id} 
                  doctors={scheduleDoctors} 
                />
              </Suspense>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {scheduleDoctors.length === 0 
                      ? 'Add active doctors first to manage schedules' 
                      : 'Select a doctor to manage their schedule'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Join Requests Tab */}
          <TabsContent value="requests">
            {ownedClinic?.id && (
              <JoinRequestsTab clinicId={ownedClinic.id} />
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default ClinicDoctors;
