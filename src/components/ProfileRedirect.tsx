import { Navigate, useLocation } from 'react-router-dom';

/**
 * Legacy `/profile` alias → `/dashboard`. Preserves any incoming `?tab=…`
 * query string and hash so deep links from emails/partner sites land on the
 * intended dashboard tab. Mounted above PublicShell so the redirect runs
 * before Navbar/Footer paint on a cold deep-link load.
 */
const ProfileRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: '/dashboard', search: location.search, hash: location.hash }}
      replace
    />
  );
};

export default ProfileRedirect;
