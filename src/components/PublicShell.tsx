import { memo, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import PublicPageSkeleton from '@/components/PublicPageSkeleton';
import { warmRouteGroup } from '@/lib/routeWarmup';

/**
 * Persistent layout shell for all public (non-admin, non-auth) routes.
 *
 * Mounts Navbar + Footer + MobileNav exactly once. React Router swaps
 * only the page content via <Outlet />, eliminating the remount flash
 * (logo flicker, cart-badge re-derivation, useUserRole re-evaluation)
 * that happened when every page rendered its own shell.
 *
 * The pathname-keyed wrapper around <Outlet/> applies the page-enter
 * animation to inner content only — without remounting Navbar/Footer.
 *
 * The Suspense fallback uses a layout-matched skeleton so cold chunk
 * loads paint a visible page shell instead of a blank area + thin top bar.
 *
 * A footer-colored mobile spacer reserves room for the fixed MobileNav.
 * Keeping the spacer after the footer prevents the light page background
 * from showing as a white strip when users scroll to the very bottom.
 */
const mobileNavSpacerStyle = { paddingBottom: 'env(safe-area-inset-bottom, 0px)' };

const PublicShell = memo(() => {
  const location = useLocation();

  useEffect(() => {
    warmRouteGroup('public-shell-core', [
      '/shop',
      '/academy',
      '/about',
      '/contact',
      '/faq',
      '/privacy',
      '/terms',
      '/track-order',
      '/auth',
      '/cart',
      '/checkout',
      '/dashboard',
      '/product',
      '/course',
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="animate-page-enter flex-1 flex flex-col" key={location.pathname}>
        <Suspense fallback={<PublicPageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
      <div
        className="md:hidden h-14 sm:h-16 bg-[hsl(140,35%,10%)]"
        style={mobileNavSpacerStyle}
        aria-hidden="true"
      />
      <MobileNav />
    </div>
  );
});

PublicShell.displayName = 'PublicShell';

export default PublicShell;
