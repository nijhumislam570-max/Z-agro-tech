import { memo } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

/**
 * Persistent layout shell for all public (non-admin, non-auth) routes.
 *
 * Mounts Navbar + Footer + MobileNav exactly once. React Router swaps
 * only the page content via <Outlet />, eliminating the remount flash
 * (logo flicker, cart-badge re-derivation, useUserRole re-evaluation)
 * that happened when every page rendered its own shell.
 *
 * `pb-20 md:pb-0` on the outer wrapper reserves space for the bottom
 * MobileNav on mobile and is a no-op on desktop.
 */
const PublicShell = memo(() => {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <Navbar />
      <Outlet />
      <Footer />
      <MobileNav />
    </div>
  );
});

PublicShell.displayName = 'PublicShell';

export default PublicShell;
