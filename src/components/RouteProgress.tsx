import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Top-of-viewport progress bar that paints the moment the route changes,
 * giving users an instant "the click registered" signal — even before the
 * lazy chunk and Suspense skeleton mount.
 *
 * Works for both admin and public routes. Driven purely by `useLocation()`
 * so we don't need to wire callbacks into every <Link>.
 */
export const RouteProgress = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const firstRenderRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Skip the very first render (initial page load already has its own loader)
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    // Skip POP (back/forward) — usually instant from cache
    if (navType === 'POP') return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setVisible(true);
    setProgress(15);
    timersRef.current.push(setTimeout(() => setProgress(45), 60));
    timersRef.current.push(setTimeout(() => setProgress(75), 220));
    timersRef.current.push(setTimeout(() => setProgress(92), 500));
    timersRef.current.push(setTimeout(() => {
      setProgress(100);
      timersRef.current.push(setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 180));
    }, 800));

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [pathname, navType]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] h-0.5 bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-[width] duration-200 ease-out rounded-r-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default RouteProgress;
