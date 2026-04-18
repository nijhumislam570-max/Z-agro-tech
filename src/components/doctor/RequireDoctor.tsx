import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useDoctor } from '@/hooks/useDoctor';

interface RequireDoctorProps {
  children: React.ReactNode;
}

export const RequireDoctor = ({ children }: RequireDoctorProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDoctor, isAdmin, isLoading: roleLoading } = useUserRole();
  const { doctorProfile, profileLoading } = useDoctor();

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

  // User doesn't have doctor role
  if (!isDoctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You need a Doctor account to access this page. If your role was recently updated, it may take a moment to sync.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Has doctor role but profile is loading
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Has doctor role but no doctor profile record yet (admin just assigned role)
  if (!doctorProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert>
            <Clock className="h-5 w-5" />
            <AlertTitle>Profile Setup Required</AlertTitle>
            <AlertDescription>
              Your Doctor role has been assigned, but your professional profile hasn't been created yet. Please complete your verification to get started.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/doctor/verification')}>Complete Verification</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // Has doctor role + profile — check verification status
  const verificationStatus = (doctorProfile as any).verification_status;

  if (verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert>
            <Clock className="h-5 w-5" />
            <AlertTitle>Verification Pending</AlertTitle>
            <AlertDescription>
              Your verification documents are under review. You'll be able to access the Doctor Dashboard once approved by an administrator.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/doctor/verification')}>View Status</Button>
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
              Your verification was not approved. Please review the feedback and resubmit your documents.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/doctor/verification')}>Resubmit</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
