import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Stethoscope, Search, CheckCircle, XCircle, Clock, 
  Eye, AlertCircle, Ban, Loader2, ExternalLink, Filter, ShieldOff, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminRealtimeDashboard } from '@/hooks/useAdminRealtimeDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { createNotification, getAdminUserIds } from '@/lib/notifications';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getSignedUrl } from '@/lib/storageUtils';
import { useAdmin } from '@/hooks/useAdmin';
import { RequireAdmin } from '@/components/admin/RequireAdmin';

interface Doctor {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  bio: string | null;
  avatar_url: string | null;
  license_number: string | null;
  is_available: boolean;
  is_verified: boolean;
  is_blocked?: boolean;
  blocked_at?: string | null;
  blocked_reason?: string | null;
  verification_status: string | null;
  verification_submitted_at: string | null;
  bvc_certificate_url: string | null;
  nid_number: string | null;
  rejection_reason: string | null;
  created_by_clinic_id: string | null;
  created_at: string;
}

const AdminDoctors = () => {
  useDocumentTitle('Doctor Management - Admin');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  useAdminRealtimeDashboard(isAdmin);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [blockReason, setBlockReason] = useState('');


  // Fetch all doctors
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Doctor[];
    },
    enabled: isAdmin,
  });

  // Approve doctor mutation
  const approveMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const doctor = doctors?.find(d => d.id === doctorId);
      const { error } = await supabase
        .from('doctors')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verification_reviewed_at: new Date().toISOString(),
        })
        .eq('id', doctorId);

      if (error) throw error;

      // Notify doctor
      if (doctor?.user_id) {
        await createNotification({
          userId: doctor.user_id,
          type: 'verification',
          title: '🎉 Verification Approved!',
          message: 'Congratulations! Your doctor profile has been verified. You are now listed on the doctors directory.',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('Doctor approved successfully');
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to approve doctor');
      logger.error(error);
    },
  });

  // Reject doctor mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ doctorId, reason }: { doctorId: string; reason: string }) => {
      const doctor = doctors?.find(d => d.id === doctorId);
      const { error } = await supabase
        .from('doctors')
        .update({
          is_verified: false,
          verification_status: 'rejected',
          verification_reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', doctorId);

      if (error) throw error;

      // Notify doctor
      if (doctor?.user_id) {
        await createNotification({
          userId: doctor.user_id,
          type: 'verification',
          title: '❌ Verification Rejected',
          message: `Your doctor verification was rejected. Reason: ${reason}. Please review and resubmit.`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('Doctor verification rejected');
      setIsRejectOpen(false);
      setIsDetailsOpen(false);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Failed to reject doctor');
      logger.error(error);
    },
  });

  // Block/Unblock doctor mutation
  const blockMutation = useMutation({
    mutationFn: async ({ doctorId, block, reason }: { doctorId: string; block: boolean; reason?: string }) => {
      const doctor = doctors?.find(d => d.id === doctorId);
      const { error } = await supabase
        .from('doctors')
        .update({
          is_blocked: block,
          blocked_at: block ? new Date().toISOString() : null,
          blocked_reason: block ? reason : null,
        })
        .eq('id', doctorId);

      if (error) throw error;

      // Notify doctor
      if (doctor?.user_id) {
        await createNotification({
          userId: doctor.user_id,
          type: 'verification',
          title: block ? '🚫 Account Blocked' : '✅ Account Unblocked',
          message: block 
            ? `Your doctor account has been blocked.${reason ? ` Reason: ${reason}` : ''}` 
            : 'Your doctor account has been unblocked. You can now access all features.',
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success(variables.block ? 'Doctor blocked' : 'Doctor unblocked');
      setIsBlockOpen(false);
      setIsDetailsOpen(false);
      setBlockReason('');
    },
    onError: (error) => {
      toast.error('Failed to update block status');
      logger.error(error);
    },
  });

  // Filter doctors
  const filteredDoctors = doctors?.filter(doctor => {
    const matchesSearch = 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && doctor.verification_status === 'pending';
    if (statusFilter === 'verified') return matchesSearch && doctor.is_verified;
    if (statusFilter === 'rejected') return matchesSearch && doctor.verification_status === 'rejected';
    if (statusFilter === 'blocked') return matchesSearch && doctor.is_blocked;
    if (statusFilter === 'not_submitted') return matchesSearch && (!doctor.verification_status || doctor.verification_status === 'not_submitted');
    return matchesSearch;
  }) || [];

  const pendingCount = doctors?.filter(d => d.verification_status === 'pending').length || 0;
  const verifiedCount = doctors?.filter(d => d.is_verified).length || 0;
  const blockedCount = doctors?.filter(d => d.is_blocked).length || 0;

  const getStatusBadge = (doctor: Doctor) => {
    if (doctor.is_blocked) {
      return <Badge className="bg-red-500/10 text-red-600">Blocked</Badge>;
    }
    if (doctor.is_verified) {
      return <Badge className="bg-green-500/10 text-green-600">Verified</Badge>;
    }
    if (doctor.verification_status === 'pending') {
      return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
    }
    if (doctor.verification_status === 'rejected') {
      return <Badge className="bg-red-500/10 text-red-600">Rejected</Badge>;
    }
    return <Badge variant="outline">Not Submitted</Badge>;
  };

  const handleViewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailsOpen(true);
  };

  return (
    <AdminLayout title="Doctor Management" subtitle="Review and manage doctor verifications">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { key: 'all', label: 'Total Doctors', value: doctors?.length || 0, icon: Stethoscope, iconColor: 'text-cyan-600 dark:text-cyan-400', iconBg: 'bg-cyan-500/10', bgClass: 'bg-gradient-to-br from-cyan-50 to-sky-50/50 border-cyan-100 dark:from-cyan-950/30 dark:to-sky-950/20 dark:border-cyan-900/50' },
          { key: 'pending', label: 'Pending', value: pendingCount, icon: Clock, iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-500/10', bgClass: 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900/50' },
          { key: 'verified', label: 'Verified', value: verifiedCount, icon: CheckCircle, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/10', bgClass: 'bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-green-950/20 dark:border-emerald-900/50' },
          { key: 'blocked', label: 'Blocked', value: blockedCount, icon: Ban, iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500/10', bgClass: 'bg-gradient-to-br from-red-50 to-rose-50/50 border-red-100 dark:from-red-950/30 dark:to-rose-950/20 dark:border-red-900/50' },
        ].map(({ key, label, value, icon: Icon, iconColor, iconBg, bgClass }) => {
          const isActive = statusFilter === key;
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => setStatusFilter(isActive && key !== 'all' ? 'all' : key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStatusFilter(isActive && key !== 'all' ? 'all' : key); }}
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
            placeholder="Search doctors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 sm:h-11 rounded-xl text-sm">
            <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="not_submitted">Not Submitted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Doctors List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No doctors found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredDoctors.map((doctor) => (
            <Card 
              key={doctor.id} 
              className="hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99]"
              onClick={() => handleViewDetails(doctor)}
            >
              <CardContent className="p-3 sm:p-4">
                {/* Mobile: stacked layout, Desktop: horizontal */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Doctor Info */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={doctor.avatar_url || ''} />
                      <AvatarFallback>
                        <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{doctor.name}</h3>
                        {getStatusBadge(doctor)}
                        {doctor.created_by_clinic_id && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">Clinic Doctor</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {doctor.specialization || 'General Veterinarian'} • {doctor.experience_years || 0} yrs exp
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Registered: {format(new Date(doctor.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0 ml-[52px] sm:ml-0" onClick={(e) => e.stopPropagation()}>
                    {doctor.verification_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 min-h-[36px] sm:min-h-[44px] text-xs sm:text-sm"
                          onClick={() => approveMutation.mutate(doctor.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setIsRejectOpen(true);
                          }}
                          className="min-h-[36px] sm:min-h-[44px] text-xs sm:text-sm"
                        >
                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {doctor.is_blocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => blockMutation.mutate({ doctorId: doctor.id, block: false })}
                        disabled={blockMutation.isPending}
                        className="text-green-600 min-h-[36px] sm:min-h-[44px] text-xs sm:text-sm"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        Unblock
                      </Button>
                    )}
                    {!doctor.is_blocked && doctor.is_verified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setIsBlockOpen(true);
                        }}
                        className="text-red-600 min-h-[36px] sm:min-h-[44px] text-xs sm:text-sm"
                      >
                        <ShieldOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        Block
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Doctor Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
          <DialogHeader className="gap-1">
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedDoctor?.avatar_url || ''} />
                <AvatarFallback>
                  <Stethoscope className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              {selectedDoctor?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDoctor?.specialization || 'General Veterinarian'}
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedDoctor)}
                {selectedDoctor.verification_submitted_at && (
                  <span className="text-sm text-muted-foreground">
                    Submitted: {format(new Date(selectedDoctor.verification_submitted_at), 'MMM d, yyyy')}
                  </span>
                )}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="min-w-0">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium text-sm truncate">{selectedDoctor.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium text-sm">{selectedDoctor.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">License Number</Label>
                  <p className="font-medium text-sm">{selectedDoctor.license_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">NID Number</Label>
                  <p className="font-medium text-sm">{selectedDoctor.nid_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Experience</Label>
                  <p className="font-medium text-sm">{selectedDoctor.experience_years || 0} years</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Consultation Fee</Label>
                  <p className="font-medium text-sm">৳{selectedDoctor.consultation_fee || 0}</p>
                </div>
              </div>

              {/* Qualifications */}
              {selectedDoctor.qualifications && selectedDoctor.qualifications.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Qualifications</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDoctor.qualifications.map((q, i) => (
                      <Badge key={i} variant="secondary">{q}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedDoctor.bio && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <p className="text-sm mt-1">{selectedDoctor.bio}</p>
                </div>
              )}

              {/* BVC Certificate */}
              {selectedDoctor.bvc_certificate_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">BVC Certificate</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1" 
                    onClick={async () => {
                      const url = await getSignedUrl(selectedDoctor.bvc_certificate_url!, 'doctor-documents');
                      if (url) window.open(url, '_blank');
                      else toast.error('Failed to load document');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedDoctor.rejection_reason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <Label className="text-xs text-red-600">Rejection Reason</Label>
                  <p className="text-sm text-red-700 mt-1">{selectedDoctor.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDoctor?.verification_status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setIsRejectOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => approveMutation.mutate(selectedDoctor.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Doctor
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Doctor Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this doctor's verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDoctor && rejectMutation.mutate({ 
                doctorId: selectedDoctor.id, 
                reason: rejectionReason 
              })}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Doctor Dialog */}
      <AlertDialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-red-500" />
              Block Doctor
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the doctor from appearing in the public directory and block their access to certain features.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label>Block Reason (Optional)</Label>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Enter reason for blocking..."
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBlockReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedDoctor && blockMutation.mutate({ 
                doctorId: selectedDoctor.id, 
                block: true,
                reason: blockReason 
              })}
              className="bg-red-600 hover:bg-red-700"
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Block Doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminDoctors;
