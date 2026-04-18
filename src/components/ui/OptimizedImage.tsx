import { useState, useRef, useEffect, memo, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedUrl, type ImagePreset } from '@/lib/imageUtils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Supabase storage preset for server-side resizing */
  preset?: ImagePreset;
  /** Show skeleton placeholder while loading */
  skeleton?: boolean;
  /** Mark as above-the-fold for eager loading */
  priority?: boolean;
  /** Fallback element on error */
  fallback?: React.ReactNode;
  /** Built-in aspect ratio to prevent CLS */
  aspectRatio?: number;
}

/**
 * Universal optimized image component.
 * - Intersection Observer lazy loading
 * - Skeleton placeholder with fade-in
 * - Supabase storage URL transforms
 * - Proper width/height/decoding attributes
 */
const OptimizedImage = memo(
  forwardRef<HTMLDivElement, OptimizedImageProps>(
    (
      {
        src,
        alt = '',
        className,
        preset,
        skeleton = true,
        priority = false,
        fallback,
        aspectRatio,
        width,
        height,
        style,
        ...imgProps
      },
      ref
    ) => {
      const [loaded, setLoaded] = useState(false);
      const [error, setError] = useState(false);
      const [inView, setInView] = useState(priority);
      const containerRef = useRef<HTMLDivElement>(null);

      // Compute optimized URL
      const optimizedSrc = preset ? getOptimizedUrl(src, preset) : src || '';

      useEffect(() => {
        if (priority) return; // already in view
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setInView(true);
              observer.disconnect();
            }
          },
          { rootMargin: '200px', threshold: 0.01 }
        );
        observer.observe(el);
        return () => observer.disconnect();
      }, [priority]);

      return (
        <div
          ref={(node) => {
            containerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn('relative overflow-hidden', className)}
          style={{ aspectRatio, ...style }}
        >
          {/* Skeleton placeholder */}
          {skeleton && !loaded && !error && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}

          {/* Error state */}
          {error &&
            (fallback || (
              <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                <span className="text-xs">Failed to load</span>
              </div>
            ))}

          {/* Image */}
          {inView && !error && (
            <img
              src={optimizedSrc}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              {...(priority ? { fetchPriority: 'high' as const } : {})}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                loaded ? 'opacity-100' : 'opacity-0'
              )}
              {...imgProps}
            />
          )}
        </div>
      );
    }
  )
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
