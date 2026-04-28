import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_ANNOUNCEMENTS: Record<string, string> = {
  '/': 'Home - Z Agro Tech',
  '/about': 'About - Z Agro Tech',
  '/contact': 'Contact - Z Agro Tech',
  '/faq': 'FAQ - Z Agro Tech',
  '/privacy': 'Privacy Policy - Z Agro Tech',
  '/terms': 'Terms - Z Agro Tech',
  '/shop': 'Shop - Z Agro Tech',
  '/cart': 'Cart - Z Agro Tech',
  '/checkout': 'Checkout - Z Agro Tech',
  '/track-order': 'Track Order - Z Agro Tech',
  '/academy': 'Academy - Z Agro Tech',
  '/dashboard': 'Dashboard - Z Agro Tech',
  '/auth': 'Sign In - Z Agro Tech',
  '/forgot-password': 'Forgot Password - Z Agro Tech',
  '/reset-password': 'Reset Password - Z Agro Tech',
  '/admin': 'Dashboard - Admin - Z Agro Tech',
  '/admin/analytics': 'Analytics - Admin - Z Agro Tech',
  '/admin/products': 'Products - Admin - Z Agro Tech',
  '/admin/orders': 'Orders Management - Admin - Z Agro Tech',
  '/admin/ecommerce-customers': 'E-Commerce Customers - Admin - Z Agro Tech',
  '/admin/coupons': 'Coupons - Admin - Z Agro Tech',
  '/admin/delivery-zones': 'Delivery Zones - Admin - Z Agro Tech',
  '/admin/incomplete-orders': 'Incomplete Orders - Admin - Z Agro Tech',
  '/admin/recovery-analytics': 'Recovery Analytics - Admin - Z Agro Tech',
  '/admin/courses': 'Courses - Admin - Z Agro Tech',
  '/admin/enrollments': 'Enrollments - Admin - Z Agro Tech',
  '/admin/customers': 'User Management - Admin - Z Agro Tech',
  '/admin/messages': 'Contact Messages - Admin - Z Agro Tech',
  '/admin/settings': 'Settings - Admin - Z Agro Tech',
};

const getRouteAnnouncementTitle = (pathname: string): string => {
  if (ROUTE_ANNOUNCEMENTS[pathname]) return ROUTE_ANNOUNCEMENTS[pathname];
  if (pathname.startsWith('/product/')) return 'Product Details - Z Agro Tech';
  if (pathname.startsWith('/course/')) return 'Course Details - Z Agro Tech';
  if (pathname.startsWith('/admin/')) return 'Admin Page - Z Agro Tech';
  return document.title || 'New page';
};

/**
 * Manages focus for route changes to improve accessibility
 * Announces page changes to screen readers.
 *
 * Audit P0 fix:
 *  - Replaced setTimeout(100) with requestIdleCallback to stop competing
 *    with React Router's commit + RouteProgress paint on the same tick.
 *  - Skips the focus shift if focus is already inside <main> (avoids the
 *    visible focus-ring flash on heavy admin pages on every navigation).
 *  - Skips the screen-reader announcement on the very first mount.
 */
export const useFocusManagement = () => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const firstRunRef = useRef(true);

  useEffect(() => {
    // Skip on initial mount — there's no "navigation" yet.
    if (firstRunRef.current) {
      firstRunRef.current = false;
      previousPathRef.current = location.pathname;
      return;
    }
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;
    const nextPathname = location.pathname;

    // Defer to browser idle so we don't compete with the route's first paint.
    const ric: (cb: () => void) => number = (cb) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        return (window as unknown as {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        }).requestIdleCallback(cb, { timeout: 500 });
      }
      return setTimeout(cb, 200) as unknown as number;
    };
    const cic: (id: number) => void = (id) => {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };

    const id = ric(() => {
      const mainContent = document.getElementById('main-content') ||
                          document.querySelector('main') ||
                          document.querySelector('[role="main"]');

      // Only shift focus if it's currently somewhere benign (body) or outside
      // the main landmark — never steal focus from an active form field.
      if (mainContent) {
        const active = document.activeElement;
        const focusInsideMain = active && mainContent.contains(active);
        const focusOnBody = active === document.body || active === null;

        if (!focusInsideMain && focusOnBody) {
          mainContent.setAttribute('tabindex', '-1');
          mainContent.focus({ preventScroll: true });
          mainContent.addEventListener('blur', () => {
            mainContent.removeAttribute('tabindex');
          }, { once: true });
        }
      }

      // Announce to screen readers.
      const pageTitle = getRouteAnnouncementTitle(nextPathname);
      announceToScreenReader(`Navigated to ${pageTitle}`);
    });

    return () => cic(id);
  }, [location.pathname]);

  return null;
};

/**
 * Announces a message to screen readers via an ARIA live region
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  // Find or create announcer element
  let announcer = document.getElementById('sr-announcer');

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  // Update priority if needed
  announcer.setAttribute('aria-live', priority);

  // Clear and set message (needs to change for screen readers to announce)
  announcer.textContent = '';
  requestAnimationFrame(() => {
    announcer!.textContent = message;
  });
};

/**
 * Hook for announcing loading states to screen readers
 */
export const useLoadingAnnouncement = (isLoading: boolean, loadingMessage = 'Loading...', loadedMessage = 'Content loaded') => {
  const previousLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (previousLoadingRef.current !== isLoading) {
      if (isLoading) {
        announceToScreenReader(loadingMessage, 'polite');
      } else if (previousLoadingRef.current) {
        announceToScreenReader(loadedMessage, 'polite');
      }
      previousLoadingRef.current = isLoading;
    }
  }, [isLoading, loadingMessage, loadedMessage]);
};

export default useFocusManagement;
