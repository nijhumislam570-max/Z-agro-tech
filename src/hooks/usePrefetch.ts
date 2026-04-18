import { useCallback } from 'react';
import { prefetchRoute } from '@/lib/imageUtils';

/**
 * Returns onMouseEnter / onTouchStart handlers that prefetch
 * the target route's JS chunk for instant navigation.
 */
export function usePrefetch(path: string) {
  const handlers = useCallback(
    () => prefetchRoute(path),
    [path]
  );

  return {
    onMouseEnter: handlers,
    onTouchStart: handlers,
  };
}
