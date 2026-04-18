import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stethoscope, Clock, Ban, CheckCircle, XCircle, ExternalLink, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { createNotification } from '@/lib/notifications';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

const CMSClinicalTab = () => {
  const queryClient = useQueryClient();
  const [certImage, setCertImage] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cms-clinical-stats'],
    queryFn: async () => {
      const [
        { count: totalDoctors },
        { count: pendingVerifications },
        { count: blockedAccounts },
      ] = await Promise.all([
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
      ]);
      return { totalDoctors: totalDoctors || 0, pendingVerifications: pendingVerifications || 0, blockedAccounts: blockedAccounts || 0 };
    },
    staleTime: 30000,
  });

  // Pending doctors
  const { data: pendingDoctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['cms-pending-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('id, name, specialization, avatar_url, bvc_certificate_url, verification_submitted_at, user_id')
        .eq('verification_status', 'pending')
        .order('verification_submitted_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  // Clinics
  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ['cms-clinics-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, is_blocked, is_verified, image_url')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });

  // Approve
  const approveMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const doctor = pendingDoctors?.find(d => d.id === doctorId);
      const { error } = await supabase.from('doctors').update({
        is_verified: true,
        verification_status: 'approved',
        verification_reviewed_at: new Date().toISOString(),
      }).eq('id', doctorId);
      if (error) throw error;
      if (doctor?.user_id) {
        await createNotification({ userId: doctor.user_id, type: 'verification', title: '🎉 Verification Approved!', message: 'Your doctor profile has been verified.' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pending-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['cms-clinical-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('Doctor approved');
    },
    onError: () => toast.error('Failed to approve doctor'),
  });

  // Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ doctorId, reason }: { doctorId: string; reason: string }) => {
      const doctor = pendingDoctors?.find(d => d.id === doctorId);
      const { error } = await supabase.from('doctors').update({
        is_verified: false,
        verification_status: 'rejected',
        verification_reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      }).eq('id', doctorId);
      if (error) throw error;
      if (doctor?.user_id) {
        await createNotification({ userId: doctor.user_id, type: 'verification', title: '❌ Verification Rejected', message: `Reason: ${reason}` });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-pending-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['cms-clinical-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setRejectId(null);
      setRejectReason('');
      toast.success('Doctor rejected');
    },
    onError: () => toast.error('Failed to reject doctor'),
  });

  // Toggle clinic block
  const toggleClinicBlock = useMutation({
    mutationFn: async ({ clinicId, blocked }: { clinicId: string; blocked: boolean }) => {
      const { error } = await supabase.from('clinics').update({
        is_blocked: blocked,
        blocked_at: blocked ? new Date().toISOString() : null,
      }).eq('id', clinicId);
      if (error) throw error;
    },
    onSuccess: (_, { blocked }) => {
      queryClient.invalidateQueries({ queryKey: ['cms-clinics-status'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success(blocked ? 'Clinic blocked' : 'Clinic unblocked');
    },
    onError: () => toast.error('Failed to update clinic'),
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Total Doctors" value={stats?.totalDoctors || 0} icon={<Stethoscope className="h-5 w-5 text-cyan-500" />} iconClassName="bg-cyan-500/10" href="/admin/doctors" />
            <StatCard title="Pending Verifications" value={stats?.pendingVerifications || 0} icon={<Clock className="h-5 w-5 text-amber-500" />} iconClassName="bg-amber-500/10" href="/admin/doctors" />
            <StatCard title="Blocked Accounts" value={stats?.blockedAccounts || 0} icon={<Ban className="h-5 w-5 text-destructive" />} iconClassName="bg-destructive/10" />
          </>
        )}
      </div>

      {/* Verification Queue */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">Verification Queue</CardTitle>
            <Link to="/admin/doctors">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" /> Manage Doctors
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {doctorsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : !pendingDoctors?.length ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending verifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.map((doctor) => (
                <div key={doctor.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={doctor.avatar_url || ''} />
                      <AvatarFallback><Stethoscope className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialization || 'General'}</p>
                      {doctor.verification_submitted_at && (
                        <p className="text-[10px] text-muted-foreground">Submitted {format(new Date(doctor.verification_submitted_at), 'MMM d, yyyy')}</p>
                      )}
                    </div>
                    {doctor.bvc_certificate_url && (
                      <button onClick={() => setCertImage(doctor.bvc_certificate_url)} className="shrink-0">
                        <img src={doctor.bvc_certificate_url} alt="Certificate" className="h-12 w-12 rounded-md object-cover border cursor-pointer hover:opacity-80 transition-opacity" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-[52px] sm:ml-0 shrink-0">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8" onClick={() => approveMutation.mutate(doctor.id)} disabled={approveMutation.isPending}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" size="sm" className="text-xs h-8" onClick={() => setRejectId(doctor.id)}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clinic Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">Clinic Status</CardTitle>
            <Link to="/admin/clinics">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="h-3.5 w-3.5" /> Manage Clinics
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {clinicsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : !clinics?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No clinics registered</p>
          ) : (
            <div className="space-y-2">
              {clinics.map((clinic) => (
                <div key={clinic.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={clinic.image_url || ''} />
                      <AvatarFallback><Building2 className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{clinic.name}</p>
                      <div className="flex items-center gap-1.5">
                        {clinic.is_verified && <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">Verified</Badge>}
                        {clinic.is_blocked && <Badge variant="destructive" className="text-[10px]">Blocked</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{clinic.is_blocked ? 'Blocked' : 'Active'}</span>
                    <Switch
                      checked={!clinic.is_blocked}
                      onCheckedChange={(active) => toggleClinicBlock.mutate({ clinicId: clinic.id, blocked: !active })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificate Lightbox */}
      <Dialog open={!!certImage} onOpenChange={() => setCertImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>BVC Certificate</DialogTitle>
          </DialogHeader>
          {certImage && <img src={certImage} alt="BVC Certificate" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Verification</AlertDialogTitle>
            <AlertDialogDescription>Provide a reason for rejection. The doctor will be notified.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[80px]" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectId && rejectMutation.mutate({ doctorId: rejectId, reason: rejectReason })}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CMSClinicalTab;
