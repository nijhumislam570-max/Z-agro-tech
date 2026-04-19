import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchRoute } from '@/lib/imageUtils';
import { prefetchPublicRoute } from '@/lib/publicPrefetch';

/**
 * Returns onMouseEnter / onFocus / onTouchStart handlers that prefetch
 * BOTH the target route's JS chunk AND its primary Supabase data,
 * for instant navigation. Idempotent — internal Sets de-dupe per session.
 */
export function usePrefetch(path: string) {
  const qc = useQueryClient();

  const handler = useCallback(() => {
    prefetchRoute(path);
    prefetchPublicRoute(path, qc);
  }, [path, qc]);

  return {
    onMouseEnter: handler,
    onFocus: handler,
    onTouchStart: handler,
  };
}
