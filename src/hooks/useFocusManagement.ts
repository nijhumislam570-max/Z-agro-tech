import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Manages focus for route changes to improve accessibility
 * Announces page changes to screen readers
 */
export const useFocusManagement = () => {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only run on route change
    if (previousPathRef.current === location.pathname) return;
    previousPathRef.current = location.pathname;

    // Small delay to allow the new page to render
    const timeoutId = setTimeout(() => {
      // Try to find the main content
      const mainContent = document.getElementById('main-content') || 
                          document.querySelector('main') ||
                          document.querySelector('[role="main"]');
      
      // Focus the main content area for keyboard users
      if (mainContent) {
        mainContent.setAttribute('tabindex', '-1');
        mainContent.focus({ preventScroll: true });
        // Remove tabindex after focusing to maintain natural tab order
        mainContent.addEventListener('blur', () => {
          mainContent.removeAttribute('tabindex');
        }, { once: true });
      }

      // Announce page change to screen readers
      const pageTitle = document.title || 'New page';
      announceToScreenReader(`Navigated to ${pageTitle}`);
    }, 100);

    return () => clearTimeout(timeoutId);
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
