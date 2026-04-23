import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyMountProps {
  children: ReactNode;
  /** Fallback shown until the wrapper enters the viewport. */
  fallback?: ReactNode;
  /** Pixels of root margin so children mount slightly before being visible. */
  rootMargin?: string;
  /** Outer wrapper className (forward grid-col spans here). */
  className?: string;
  /** Approximate min-height for the placeholder so layout doesn't jump. */
  minHeight?: string;
}

/**
 * Defers mounting children until the wrapper scrolls near the viewport.
 * Used by below-the-fold dashboard tiles to avoid issuing their data
 * queries on initial mount when the user lands on a tab they don't see.
 */
export const LazyMount = ({
  children,
  fallback,
  rootMargin = '200px',
  className,
  minHeight = '12rem',
}: LazyMountProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} style={!visible ? { minHeight } : undefined}>
      {visible ? children : (fallback ?? <Skeleton className="h-full w-full rounded-2xl" style={{ minHeight }} />)}
    </div>
  );
};

export default LazyMount;
