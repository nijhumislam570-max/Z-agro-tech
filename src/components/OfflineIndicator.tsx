import { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Displays an indicator when the user goes offline, and a brief
 * "back online" toast when reconnected.
 *
 * The reconnect timeout is tracked in a ref so it can be cleared on
 * unmount or rapid network toggles, preventing leaked timers.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        setShowReconnected(true);
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => {
          setShowReconnected(false);
          reconnectTimerRef.current = null;
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      // If we go offline before the "back online" toast has hidden, drop it
      clearReconnectTimer();
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearReconnectTimer();
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-slide-down"
        role="alert"
        aria-live="assertive"
      >
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        <span>You're offline. Some features may not be available.</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[100] bg-success text-success-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-slide-down"
        role="status"
        aria-live="polite"
      >
        <Wifi className="h-4 w-4" aria-hidden="true" />
        <span>You're back online!</span>
      </div>
    );
  }

  return null;
}

export default OfflineIndicator;
