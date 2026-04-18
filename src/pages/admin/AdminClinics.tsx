import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Star,
  Users,
  Calendar,
  Filter,
  AlertCircle,
  Clock,
  FileText,
  Ban,
  Trash2,
  Shield,
  MoreVertical,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ClinicVerificationDialog } from '@/components/admin/ClinicVerificationDialog';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  image_url: string | null;
  is_open: boolean;
  is_verified: boolean;
  is_blocked: boolean | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  verification_status: string | null;
  bvc_certificate_url: string | null;
  trade_license_url: string | null;
  rejection_reason: string | null;
  verification_submitted_at: string | null;
  owner_name: string | null;
  owner_nid: string | null;
  rating: number;
  created_at: string;
  owner_user_id: string | null;
  services: string[] | null;
  opening_hours: string | null;
}

import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const AdminClinics = () => {
  useDocumentTitle('Clinics Management - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionClinic, setActionClinic] = useState<Clinic | null>(null);
  const [blockReason, setBlockReason] = useState('');

  // Fetch all clinics
  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ['admin-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, phone, email, description, image_url, is_open, is_verified, is_blocked, blocked_at, blocked_reason, verification_status, bvc_certificate_url, trade_license_url, rejection_reason, verification_submitted_at, owner_name, owner_nid, rating, created_at, owner_user_id, services, opening_hours')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Clinic[];
    },
    enabled: isAdmin,
  });

  // Fetch clinic stats
  const { data: clinicStats } = useQuery({
    queryKey: ['admin-clinic-stats'],
    queryFn: async () => {
      const [
        { count: totalClinics },
        { count: verifiedClinics },
        { count: totalDoctors },
        { count: totalAppointments },
      ] = await Promise.all([
        supabase.from('clinics').select('*', { count: 'exact', head: true }),
        supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('clinic_doctors').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalClinics: totalClinics || 0,
        verifiedClinics: verifiedClinics || 0,
        totalDoctors: totalDoctors || 0,
        totalAppointments: totalAppointments || 0,
      };
    },
    enabled: isAdmin,
  });

  // Toggle verification mutation
  const toggleVerification = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from('clinics')
        .update({ is_verified: !isVerified })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success('Clinic verification status updated');
    },
    onError: () => {
      toast.error('Failed to update verification status');
    },
  });

  // Toggle open/closed mutation
  const toggleOpenStatus = useMutation({
    mutationFn: async ({ id, isOpen }: { id: string; isOpen: boolean }) => {
      const { error } = await supabase
        .from('clinics')
        .update({ is_open: !isOpen })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success('Clinic status updated');
    },
    onError: () => {
      toast.error('Failed to update clinic status');
    },
  });

  // Block/Unblock mutation
  const blockMutation = useMutation({
    mutationFn: async ({ clinic, reason }: { clinic: Clinic; reason?: string }) => {
      const isCurrentlyBlocked = clinic.is_blocked;

      const { error } = await supabase
        .from('clinics')
        .update({
          is_blocked: !isCurrentlyBlocked,
          blocked_at: isCurrentlyBlocked ? null : new Date().toISOString(),
          blocked_reason: isCurrentlyBlocked ? null : reason || 'Blocked by admin',
        })
        .eq('id', clinic.id);

      if (error) throw error;
      return !isCurrentlyBlocked;
    },
    onSuccess: (wasBlocked) => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success(wasBlocked ? 'Clinic blocked successfully' : 'Clinic unblocked successfully');
      setBlockDialogOpen(false);
      setBlockReason('');
      setActionClinic(null);
    },
    onError: () => {
      toast.error('Failed to update clinic block status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', clinicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success('Clinic deleted permanently');
      setDeleteDialogOpen(false);
      setActionClinic(null);
    },
    onError: () => {
      toast.error('Failed to delete clinic');
    },
  });

  // Filter clinics
  const filteredClinics = clinics?.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'verified') return matchesSearch && clinic.is_verified;
    if (filterStatus === 'unverified') return matchesSearch && !clinic.is_verified;
    if (filterStatus === 'pending') return matchesSearch && clinic.verification_status === 'pending';
    if (filterStatus === 'blocked') return matchesSearch && clinic.is_blocked;
    if (filterStatus === 'open') return matchesSearch && clinic.is_open;
    if (filterStatus === 'closed') return matchesSearch && !clinic.is_open;
    return matchesSearch;
  });

  const pendingCount = clinics?.filter(c => c.verification_status === 'pending').length || 0;
  const blockedCount = clinics?.filter(c => c.is_blocked).length || 0;

  return (
    <AdminLayout title="Clinics Management" subtitle="Manage and verify veterinary clinics">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { key: 'all', label: 'Total Clinics', value: clinicStats?.totalClinics || 0, icon: Building2, iconColor: 'text-teal-600 dark:text-teal-400', iconBg: 'bg-teal-500/10', bgClass: 'bg-gradient-to-br from-teal-50 to-cyan-50/50 border-teal-100 dark:from-teal-950/30 dark:to-cyan-950/20 dark:border-teal-900/50' },
          { key: 'verified', label: 'Verified', value: clinicStats?.verifiedClinics || 0, icon: CheckCircle, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/10', bgClass: 'bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50' },
          { key: 'pending', label: 'Pending', value: pendingCount, icon: Clock, iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-500/10', bgClass: 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50' },
          { key: 'blocked', label: 'Blocked', value: blockedCount, icon: Ban, iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500/10', bgClass: 'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900/50' },
        ].map(({ key, label, value, icon: Icon, iconColor, iconBg, bgClass }) => {
          const isActive = filterStatus === key;
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => setFilterStatus(isActive && key !== 'all' ? 'all' : key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFilterStatus(isActive && key !== 'all' ? 'all' : key); }}
              className={cn(
                'rounded-xl sm:rounded-2xl p-3 sm:p-4 border shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]',
                bgClass,
                isActive && 'ring-2 ring-primary/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider leading-tight mb-0.5 sm:mb-1">
                    {label}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{value}</p>
                </div>
                <div className={cn('h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
                  <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clinics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44 h-10 sm:h-11 rounded-xl text-sm">
            <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            <SelectItem value="pending">
              <span className="flex items-center gap-2">
                Pending {pendingCount > 0 && <Badge variant="secondary" className="h-5 text-xs">{pendingCount}</Badge>}
              </span>
            </SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
            <SelectItem value="blocked">
              <span className="flex items-center gap-2">
                Blocked {blockedCount > 0 && <Badge variant="destructive" className="h-5 text-xs">{blockedCount}</Badge>}
              </span>
            </SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clinics List */}
      {clinicsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredClinics && filteredClinics.length > 0 ? (
        <div className="grid gap-4">
          {filteredClinics.map((clinic) => (
            <Card 
              key={clinic.id} 
              className={cn(
                "overflow-hidden transition-all duration-200 hover:shadow-lg border-l-4",
                clinic.is_blocked 
                  ? "border-l-destructive bg-destructive/5" 
                  : clinic.is_verified 
                    ? "border-l-green-500" 
                    : clinic.verification_status === 'pending'
                      ? "border-l-amber-500"
                      : "border-l-muted"
              )}
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section - Avatar and Info */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl shadow-sm ring-2 ring-background flex-shrink-0">
                      <AvatarImage src={clinic.image_url || ''} className="object-cover" />
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Name and Badges */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-sm sm:text-base lg:text-lg text-foreground truncate max-w-[150px] sm:max-w-none">{clinic.name}</h3>
                        {clinic.is_verified && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                            <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            Verified
                          </Badge>
                        )}
                        {clinic.verification_status === 'pending' && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            Pending
                          </Badge>
                        )}
                        {clinic.is_blocked && (
                          <Badge variant="destructive" className="animate-pulse text-[10px] sm:text-xs px-1.5 sm:px-2">
                            <Ban className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            Blocked
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "font-medium text-[10px] sm:text-xs px-1.5 sm:px-2",
                            clinic.is_open 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          )}
                        >
                          {clinic.is_open ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      
                      {/* Contact Info - Responsive */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
                        {clinic.address && (
                          <span className="flex items-center gap-1 sm:gap-1.5 bg-muted/50 px-1.5 sm:px-2 py-0.5 rounded-md">
                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
                            <span className="truncate max-w-[120px] sm:max-w-[180px] lg:max-w-none">{clinic.address}</span>
                          </span>
                        )}
                        {clinic.phone && (
                          <span className="flex items-center gap-1 sm:gap-1.5 bg-muted/50 px-1.5 sm:px-2 py-0.5 rounded-md">
                            <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500 flex-shrink-0" />
                            {clinic.phone}
                          </span>
                        )}
                        {clinic.email && (
                          <span className="hidden sm:flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md">
                            <Mail className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{clinic.email}</span>
                          </span>
                        )}
                      </div>
                      
                      {/* Rating and Date */}
                      <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                        <div className="flex items-center gap-1 bg-amber-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-amber-500" />
                          <span className="text-xs sm:text-sm font-semibold text-amber-700">{clinic.rating || 0}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          Joined {format(new Date(clinic.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Section - Action Buttons */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2 lg:mt-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClinic(clinic);
                        setDetailsOpen(true);
                      }}
                      className="h-9 flex-1 sm:flex-none text-xs sm:text-sm rounded-xl bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors min-h-[44px] sm:min-h-0"
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      View
                    </Button>
                    
                    <Button
                      variant={clinic.is_blocked ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (clinic.is_blocked) {
                          blockMutation.mutate({ clinic, reason: '' });
                        } else {
                          setActionClinic(clinic);
                          setBlockDialogOpen(true);
                        }
                      }}
                      disabled={blockMutation.isPending}
                      className={cn(
                        "h-9 flex-1 sm:flex-none text-xs sm:text-sm transition-colors rounded-xl min-h-[44px] sm:min-h-0",
                        clinic.is_blocked 
                          ? "bg-green-600 hover:bg-green-700" 
                          : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                      )}
                    >
                      {clinic.is_blocked ? (
                        <>
                          <Shield className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Unblock</span>
                          <span className="sm:hidden">Unblock</span>
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1.5" />
                          <span className="hidden sm:inline">Block</span>
                          <span className="sm:hidden">Block</span>
                        </>
                      )}
                    </Button>

                    {/* Improved More Actions Button */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl border-muted-foreground/20 hover:bg-muted hover:border-muted-foreground/30 transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex-shrink-0"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 shadow-lg">
                        {clinic.verification_status === 'pending' ? (
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setDetailsOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <FileText className="h-4 w-4 mr-2 text-amber-500" />
                            Review Verification
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => toggleVerification.mutate({ id: clinic.id, isVerified: clinic.is_verified })}
                            className="cursor-pointer"
                          >
                            {clinic.is_verified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                                Unverify Clinic
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Verify Clinic
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => toggleOpenStatus.mutate({ id: clinic.id, isOpen: clinic.is_open })}
                          className="cursor-pointer"
                        >
                          <Clock className="h-4 w-4 mr-2 text-blue-500" />
                          {clinic.is_open ? 'Close Clinic' : 'Open Clinic'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          onClick={() => {
                            setActionClinic(clinic);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Clinic
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No clinics found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'No clinics have registered yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Clinic Verification Dialog */}
      <ClinicVerificationDialog
        clinic={selectedClinic}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Block Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Block Clinic?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Blocking "{actionClinic?.name}" will prevent them from receiving new appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3">
            <Label htmlFor="blockReason" className="text-sm">Block Reason (optional)</Label>
            <Textarea
              id="blockReason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Violation of terms..."
              rows={2}
              className="mt-2 rounded-xl text-sm"
            />
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel disabled={blockMutation.isPending} className="rounded-xl h-11 sm:h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionClinic && blockMutation.mutate({ clinic: actionClinic, reason: blockReason })}
              disabled={blockMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 rounded-xl h-11 sm:h-10"
            >
              {blockMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Ban className="h-4 w-4 mr-1" />
              )}
              Block Clinic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Clinic Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete "{actionClinic?.name}"
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleteMutation.isPending} className="rounded-xl h-11 sm:h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionClinic && deleteMutation.mutate(actionClinic.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90 rounded-xl h-11 sm:h-10"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminClinics;
