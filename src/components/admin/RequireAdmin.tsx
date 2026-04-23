import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { toast } from 'sonner';

interface RequireAdminProps {
  children: React.ReactNode;
}

/**
 * Admin route guard. Mirrors RequireAuth's declarative `<Navigate state={{ from }}>`
 * pattern so both guards round-trip through AuthPage the same way.
 *
 * - Unauthenticated → bounce to /auth with full location preserved.
 * - Authenticated but not admin → render an "Access Denied" panel with a
 *   delayed redirect to home; toast is shown once via toastedRef.
 */
export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const toastedRef = useRef(false);

  // Toast + delayed redirect for non-admin authenticated users. Shorter than
  // the previous 1.5s so the "Access Denied" flash is less jarring.
  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user || isAdmin) return;
    if (toastedRef.current) return;
    toastedRef.current = true;
    toast.error('Admin access required', {
      description: "You don't have permission to view this page.",
    });
    const t = setTimeout(() => {
      if (!isAdmin) navigate('/', { replace: true });
    }, 800);
    return () => clearTimeout(t);
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Checking admin access"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            You don't have permission to view this page. Redirecting you home…
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};
