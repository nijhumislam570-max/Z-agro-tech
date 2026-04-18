import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Displays an indicator when the user goes offline.
 * Shows a banner at the top of the screen that can be dismissed.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        // Hide the reconnected message after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Show offline banner
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

  // Show reconnected message briefly
  if (showReconnected) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg animate-slide-down"
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
