import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

/**
 * Catch-all rendered inside the persistent AdminShell when an admin path
 * doesn't match any registered child route. Without this, typos like
 * `/admin/orderz` would render an empty <Outlet /> and look broken.
 */
const AdminNotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.warn('[Admin 404]', location.pathname);
  }, [location.pathname]);

  return (
    <main
      id="main-content"
      className="flex-1 flex items-center justify-center px-4 py-12 animate-page-enter"
    >
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Compass className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">404</p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Admin page not found
          </h1>
          <p className="text-muted-foreground text-sm">
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {location.pathname}
            </code>{' '}
            isn't a known admin route. Pick a destination below.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/admin">
              <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
              Admin Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Go back
          </Button>
        </div>
      </div>
    </main>
  );
};

export default AdminNotFound;
