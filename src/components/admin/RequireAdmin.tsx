import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { toast } from 'sonner';

interface RequireAdminProps {
  children: React.ReactNode;
}

export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const toastedRef = useRef(false);

  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
      return;
    }

    if (!isAdmin && !toastedRef.current) {
      toastedRef.current = true;
      toast.error('Admin access required', {
        description: "You don't have permission to view this page.",
      });
      const t = setTimeout(() => {
        // Re-check inside the timeout — guards against late role-resolution races
        // where the user's admin role becomes truthy between toast + redirect.
        if (!isAdmin) navigate('/', { replace: true });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            You don't have permission to view this page. Redirecting you home…
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};
