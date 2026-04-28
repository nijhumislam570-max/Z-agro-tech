import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthUser } from '@/contexts/AuthContext';
import { trackPageView } from '@/lib/analytics';
import { setSentryRoute, setSentryUser } from '@/lib/sentry';

const SentryScopeSync = () => {
  const user = useAuthUser();
  const { pathname } = useLocation();

  useEffect(() => {
    setSentryUser(user ? { id: user.id } : null);
  }, [user]);

  useEffect(() => {
    trackPageView(pathname);
    setSentryRoute(pathname);
  }, [pathname]);

  return null;
};

export default SentryScopeSync;
