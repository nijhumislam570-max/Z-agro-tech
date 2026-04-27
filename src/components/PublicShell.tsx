import { memo, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import PublicPageSkeleton from '@/components/PublicPageSkeleton';

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
 * `pb-20 md:pb-0` on the outer wrapper reserves space for the bottom
 * MobileNav on mobile and is a no-op on desktop.
 */
const PublicShell = memo(() => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <Navbar />
      <div className="animate-page-enter flex-1 flex flex-col" key={location.pathname}>
        <Suspense fallback={<PublicPageSkeleton />}>
          <Outlet />
        </Suspense>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
});

PublicShell.displayName = 'PublicShell';

export default PublicShell;
