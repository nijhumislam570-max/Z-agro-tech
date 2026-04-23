import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Top-of-viewport progress bar. Two triggers:
 *  1) Imperative `startRouteProgress()` — fired on sidebar/mobile-nav click for
 *     INSTANT visual feedback before React Router commits the route.
 *  2) Reactive — `useLocation()` change still completes the bar after commit.
 *
 * Easing is driven by a single rAF loop instead of stacked setTimeouts so the
 * commit-phase only triggers React state updates when the bar visibly moves.
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

export function startRouteProgress() {
  const now = Date.now();
  if (now - activeStartedAt < 250) return; // collapse rapid clicks
  activeStartedAt = now;
  listeners.forEach((l) => l());
}

// Trickle curve: jumps to 20%, eases asymptotically toward 92%, plateaus there
// until `finish()` slams it to 100%. Single rAF loop = no stacked timers.
const trickle = (current: number) => {
  if (current >= 92) return 92;
  const remaining = 92 - current;
  return Math.min(92, current + Math.max(0.4, remaining * 0.045));
};

export const RouteProgress = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const firstRenderRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const intentTick = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const cancelRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };
  const clearTimers = () => {
    cancelRaf();
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const begin = () => {
    clearTimers();
    setVisible(true);
    setProgress(20);
    const tick = () => {
      setProgress((p) => {
        const next = trickle(p);
        if (next < 92) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
        }
        return next;
      });
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const finish = () => {
    cancelRaf();
    setProgress(100);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
      hideTimerRef.current = null;
    }, 180);
  };

  // Imperative trigger — paint immediately on click intent
  useEffect(() => {
    if (intentTick === 0) return;
    begin();
    safetyTimerRef.current = setTimeout(() => finish(), 1400);
    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intentTick]);

  // Reactive completion on actual route change
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    if (navType === 'POP') return;
    if (!visible) begin();
    finish();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navType]);

  // Cleanup on unmount
  useEffect(() => clearTimers, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] h-0.5 bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-[width] duration-150 ease-out rounded-r-full"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default RouteProgress;
