import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useClinicOwner } from '@/hooks/useClinicOwner';

interface RequireClinicOwnerProps {
  children: React.ReactNode;
}

export const RequireClinicOwner = ({ children }: RequireClinicOwnerProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isClinicOwner, isAdmin, isLoading: roleLoading } = useUserRole();
  const { ownedClinic, clinicLoading } = useClinicOwner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Still loading auth or role data
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  // Admin bypass — always allow
  if (isAdmin) return <>{children}</>;

  // User doesn't have clinic_owner role
  if (!isClinicOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You need a Clinic Owner account to access this page. If your role was recently updated, it may take a moment to sync.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Has role but clinic data is loading
  if (clinicLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Has clinic_owner role but no clinic record yet (admin just assigned role)
  if (!ownedClinic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert>
            <Clock className="h-5 w-5" />
            <AlertTitle>Clinic Setup Required</AlertTitle>
            <AlertDescription>
              Your Clinic Owner role has been assigned, but your clinic hasn't been created yet. Please complete your verification to get started.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/clinic/verification')}>Complete Verification</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Has clinic — check verification status
  const verificationStatus = ownedClinic.verification_status;

  if (verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert>
            <Clock className="h-5 w-5" />
            <AlertTitle>Verification Pending</AlertTitle>
            <AlertDescription>
              Your clinic verification documents are under review. You'll be able to access the Clinic Dashboard once approved by an administrator.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/clinic/verification')}>View Status</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Verification Rejected</AlertTitle>
            <AlertDescription>
              Your clinic verification was not approved. Please review the feedback and resubmit your documents.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/clinic/verification')}>Resubmit</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
