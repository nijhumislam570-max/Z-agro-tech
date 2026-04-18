import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  AlertTriangle,
  Ban,
  Trash2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createClinicVerificationNotification } from '@/lib/notifications';
import { getSignedUrl } from '@/lib/storageUtils';

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
  created_at: string;
}

interface ClinicVerificationDialogProps {
  clinic: Clinic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClinicVerificationDialog({
  clinic,
  open,
  onOpenChange,
}: ClinicVerificationDialogProps) {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [signedBvcUrl, setSignedBvcUrl] = useState<string | null>(null);
  const [signedTradeUrl, setSignedTradeUrl] = useState<string | null>(null);

  // Generate signed URLs for private bucket documents
  useEffect(() => {
    if (!clinic || !open) return;
    
    const loadSignedUrls = async () => {
      if (clinic.bvc_certificate_url) {
        const url = await getSignedUrl(clinic.bvc_certificate_url, 'clinic-documents');
        setSignedBvcUrl(url);
      }
      if (clinic.trade_license_url) {
        const url = await getSignedUrl(clinic.trade_license_url, 'clinic-documents');
        setSignedTradeUrl(url);
      }
    };
    loadSignedUrls();
  }, [clinic, open]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!clinic) throw new Error('No clinic selected');

      const { data: clinicData, error: fetchError } = await supabase
        .from('clinics')
        .select('owner_user_id')
        .eq('id', clinic.id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('clinics')
        .update({
          verification_status: 'approved',
          is_verified: true,
          verification_reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', clinic.id);

      if (error) throw error;

      // Notify clinic owner
      if (clinicData?.owner_user_id) {
        await createClinicVerificationNotification({
          userId: clinicData.owner_user_id,
          clinicId: clinic.id,
          clinicName: clinic.name,
          status: 'approved',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
      toast.success('Clinic approved successfully!');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to approve clinic');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!clinic) throw new Error('No clinic selected');
      if (!rejectionReason.trim()) throw new Error('Rejection reason is required');

      const { data: clinicData, error: fetchError } = await supabase
        .from('clinics')
        .select('owner_user_id')
        .eq('id', clinic.id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('clinics')
        .update({
          verification_status: 'rejected',
          is_verified: false,
          verification_reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', clinic.id);

      if (error) throw error;

      // Notify clinic owner
      if (clinicData?.owner_user_id) {
        await createClinicVerificationNotification({
          userId: clinicData.owner_user_id,
          clinicId: clinic.id,
          clinicName: clinic.name,
          status: 'rejected',
          reason: rejectionReason,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
      toast.success('Clinic verification rejected');
      setRejectionReason('');
      setShowRejectDialog(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject clinic');
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!clinic) throw new Error('No clinic selected');

      const isCurrentlyBlocked = clinic.is_blocked;

      const { data: clinicData, error: fetchError } = await supabase
        .from('clinics')
        .select('owner_user_id')
        .eq('id', clinic.id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('clinics')
        .update({
          is_blocked: !isCurrentlyBlocked,
          blocked_at: isCurrentlyBlocked ? null : new Date().toISOString(),
          blocked_reason: isCurrentlyBlocked ? null : blockReason || 'Blocked by admin',
        })
        .eq('id', clinic.id);

      if (error) throw error;

      // Notify clinic owner
      if (clinicData?.owner_user_id) {
        await createClinicVerificationNotification({
          userId: clinicData.owner_user_id,
          clinicId: clinic.id,
          clinicName: clinic.name,
          status: isCurrentlyBlocked ? 'unblocked' : 'blocked',
          reason: isCurrentlyBlocked ? undefined : blockReason || 'Blocked by admin',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success(clinic?.is_blocked ? 'Clinic unblocked' : 'Clinic blocked');
      setBlockReason('');
      setShowBlockDialog(false);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to update clinic block status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!clinic) throw new Error('No clinic selected');

      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', clinic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success('Clinic deleted permanently');
      setShowDeleteDialog(false);
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to delete clinic');
    },
  });

  if (!clinic) return null;

  const isPending = clinic.verification_status === 'pending';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-5 w-5" />
              {clinic.name}
              {clinic.is_verified && (
                <Badge variant="default" className="bg-green-500">Verified</Badge>
              )}
              {isPending && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Pending Review
                </Badge>
              )}
              {clinic.is_blocked && (
                <Badge variant="destructive">
                  <Ban className="h-3 w-3 mr-1" />
                  Blocked
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {isPending ? 'Review clinic verification request' : 'Manage clinic profile and status'}
            </DialogDescription>
          </DialogHeader>

          {/* Blocked Status Alert */}
          {clinic.is_blocked && clinic.blocked_reason && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive flex items-center gap-1 mb-1">
                <Ban className="h-4 w-4" />
                Blocked Reason
              </p>
              <p className="text-sm text-destructive/80">{clinic.blocked_reason}</p>
              {clinic.blocked_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Blocked on {format(new Date(clinic.blocked_at), 'PPpp')}
                </p>
              )}
            </div>
          )}

          <div className="space-y-6">
            {/* Owner Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Owner Name</p>
                  <p className="font-medium">{clinic.owner_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NID Number</p>
                  <p className="font-medium">{clinic.owner_nid || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Clinic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Clinic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{clinic.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{clinic.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{clinic.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              {clinic.description && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium">{clinic.description}</p>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Verification Documents
              </h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">BVC Certificate</span>
                  </div>
                  {clinic.bvc_certificate_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signedBvcUrl && window.open(signedBvcUrl, '_blank')}
                      disabled={!signedBvcUrl}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {signedBvcUrl ? 'View' : 'Loading...'}
                    </Button>
                  ) : (
                    <Badge variant="secondary">Not uploaded</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">Trade License</span>
                  </div>
                  {clinic.trade_license_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signedTradeUrl && window.open(signedTradeUrl, '_blank')}
                      disabled={!signedTradeUrl}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {signedTradeUrl ? 'View' : 'Loading...'}
                    </Button>
                  ) : (
                    <Badge variant="secondary">Not uploaded</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Previous Rejection Reason */}
            {clinic.rejection_reason && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Previous Rejection Reason
                </p>
                <p className="text-sm text-destructive/80">{clinic.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Admin Actions */}
          <DialogFooter className="gap-2 flex-wrap">
            {/* Delete button - always visible */}
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            {/* Block/Unblock button */}
            <Button
              variant={clinic.is_blocked ? 'default' : 'outline'}
              onClick={() => clinic.is_blocked ? blockMutation.mutate() : setShowBlockDialog(true)}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : clinic.is_blocked ? (
                <Shield className="h-4 w-4 mr-1" />
              ) : (
                <Ban className="h-4 w-4 mr-1" />
              )}
              {clinic.is_blocked ? 'Unblock' : 'Block'}
            </Button>

            {/* Pending verification actions */}
            {isPending && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Clinic Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will grant {clinic.name} full access to the clinic management system.
              Make sure you have reviewed all documents carefully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog with Reason */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Clinic Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection. The clinic owner will see this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Rejection Reason *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., BVC Certificate is unclear, please upload a clearer image..."
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Dialog with Reason */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block This Clinic?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocking this clinic will prevent pet parents from booking appointments. 
              The clinic profile will remain visible but marked as blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="blockReason">Block Reason (optional)</Label>
            <Textarea
              id="blockReason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Violation of terms, suspicious activity..."
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blockMutation.mutate()}
              disabled={blockMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinic Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the clinic 
              "{clinic.name}" and all associated data including appointments, doctors, 
              and services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
