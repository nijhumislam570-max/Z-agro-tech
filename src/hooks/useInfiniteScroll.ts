import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Distance from bottom to trigger loading (in pixels) */
  threshold?: number;
  /** Whether loading is currently in progress */
  isLoading?: boolean;
  /** Whether there's more data to load */
  hasMore?: boolean;
  /** Root element for intersection observer (default: viewport) */
  root?: Element | null;
}

interface UseInfiniteScrollReturn {
  /** Ref to attach to the sentinel element */
  sentinelRef: React.RefObject<HTMLDivElement>;
  /** Whether the sentinel is currently visible */
  isIntersecting: boolean;
}

/**
 * Hook for implementing infinite scroll functionality using Intersection Observer.
 * Provides a sentinel element ref that triggers a callback when visible.
 * 
 * @param onLoadMore - Callback function to load more data
 * @param options - Configuration options
 * @returns Object containing sentinelRef and visibility state
 * 
 * @example
 * ```tsx
 * const { sentinelRef } = useInfiniteScroll(
 *   () => fetchNextPage(),
 *   { isLoading, hasMore: hasNextPage }
 * );
 * 
 * return (
 *   <>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={sentinelRef} /> {/* Invisible sentinel *\/}
 *     {isLoading && <Spinner />}
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 100, isLoading = false, hasMore = true, root = null } = options;
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const callbackRef = useRef(onLoadMore);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && !isLoading && hasMore) {
          callbackRef.current();
        }
      },
      {
        root,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, isLoading, hasMore]);

  return { sentinelRef, isIntersecting };
}

/**
 * Simplified scroll position hook for detecting when user scrolls near bottom.
 * Alternative to Intersection Observer for simpler use cases.
 * 
 * @param onNearBottom - Callback when user scrolls near bottom
 * @param threshold - Distance from bottom to trigger (default: 200px)
 * 
 * @example
 * ```tsx
 * useScrollPosition(() => {
 *   if (!isLoading && hasMore) loadMore();
 * }, 300);
 * ```
 */
export function useScrollPosition(
  onNearBottom: () => void,
  threshold: number = 200
): void {
  const callbackRef = useRef(onNearBottom);

  useEffect(() => {
    callbackRef.current = onNearBottom;
  }, [onNearBottom]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;

        if (documentHeight - scrollPosition < threshold) {
          callbackRef.current();
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);
}

export default useInfiniteScroll;
