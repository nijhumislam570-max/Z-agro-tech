import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Top-of-viewport progress bar. Two triggers:
 *  1) Imperative `startRouteProgress()` — fired on sidebar/mobile-nav click for
 *     INSTANT visual feedback before React Router commits the route.
 *  2) Reactive — `useLocation()` change still completes the bar after commit.
 */

type Listener = () => void;
let activeStartedAt = 0;
const listeners = new Set<Listener>();

const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => activeStartedAt;
const getServerSnapshot = () => 0;

/**
 * Call this the moment the user expresses navigation intent (mousedown / click
 * on a router Link). Cheap, idempotent — collapses rapid clicks.
 */
export function startRouteProgress() {
  const now = Date.now();
  // Throttle to at most once per 250ms
  if (now - activeStartedAt < 250) return;
  activeStartedAt = now;
  listeners.forEach((l) => l());
}

export const RouteProgress = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const firstRenderRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Subscribe to imperative starts
  const intentTick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const begin = () => {
    clearTimers();
    setVisible(true);
    setProgress(20);
    timersRef.current.push(setTimeout(() => setProgress(55), 80));
    timersRef.current.push(setTimeout(() => setProgress(80), 260));
    timersRef.current.push(setTimeout(() => setProgress(92), 600));
  };

  const finish = () => {
    clearTimers();
    setProgress(100);
    timersRef.current.push(
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 180),
    );
  };

  // Imperative trigger — paint immediately on click
  useEffect(() => {
    if (intentTick === 0) return;
    begin();
    // Safety auto-finish if no route commit comes through (e.g. same-route click)
    const safety = setTimeout(() => finish(), 1400);
    return () => clearTimeout(safety);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentTick]);

  // Reactive completion on actual route change
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (navType === 'POP') return;
    // If imperative didn't fire (e.g. programmatic navigate), still show feedback
    if (!visible) begin();
    finish();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
