import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LazyImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  /** 'fill' mode: w-full h-full object-cover (for grids). Default: w-full h-auto (natural aspect ratio) */
  fill?: boolean;
}

/**
 * Facebook-style lazy loading image.
 * - Default mode: full-width, natural aspect ratio. Parent controls max-height via overflow-hidden.
 * - Fill mode: covers parent completely (for grid cells).
 * Uses native loading="lazy" instead of IntersectionObserver to avoid zero-height deadlocks.
 */
export const LazyImage = forwardRef<HTMLDivElement, LazyImageProps>(
  ({ src, alt = '', className, onClick, fill = false }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    return (
      <div 
        ref={ref}
        className={cn(
          'relative overflow-hidden bg-muted',
          fill ? 'w-full h-full' : isLoaded ? 'w-full' : 'w-full min-h-[200px]',
          className
        )}
      >
        {/* Placeholder skeleton */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted" />
        )}
        
        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
            <span className="text-xs">Failed to load</span>
          </div>
        )}
        
        {/* Actual image — always has src, browser handles lazy loading */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          onClick={onClick}
          className={cn(
            'w-full transition-opacity duration-300',
            fill ? 'h-full object-cover' : 'h-auto',
            isLoaded ? 'opacity-100' : 'opacity-0',
            onClick && 'cursor-pointer hover:brightness-95'
          )}
        />
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

/** Small helper: video progress bar with proper cleanup */
const VideoProgressBar = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const bar = barRef.current;
    if (!video || !bar) return;

    const update = () => {
      if (video.duration) {
        bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
      }
    };
    video.addEventListener('timeupdate', update);
    return () => video.removeEventListener('timeupdate', update);
  }, [videoRef]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
      <div ref={barRef} className="h-full bg-primary transition-all" style={{ width: '0%' }} />
    </div>
  );
};

interface LazyVideoProps {
  src: string;
  className?: string;
  poster?: string;
  /** When true, show poster + play button instead of loading video. Defaults to true on mobile. */
  facade?: boolean;
}

/**
 * Auto-playing video with viewport detection (like Facebook/Instagram)
 */
export const LazyVideo = forwardRef<HTMLDivElement, LazyVideoProps>(
  ({ src, className, poster, facade: facadeProp }, ref) => {
    const isMobile = useIsMobile();
    const useFacade = facadeProp ?? isMobile;
    const [facadeActive, setFacadeActive] = useState(useFacade);
    const [isInView, setIsInView] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          const visible = entry.isIntersecting;
          setIsInView(visible);
          
          if (videoRef.current && isLoaded) {
            if (visible) {
              videoRef.current.play().catch(() => {});
            } else {
              videoRef.current.pause();
            }
          }
        },
        { rootMargin: '0px', threshold: 0.5 }
      );

      observer.observe(element);
      return () => observer.disconnect();
    }, [isLoaded]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }, []);

    const togglePlay = () => {
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    };

    const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!videoRef.current) return;
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    return (
      <div 
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn('relative overflow-hidden bg-muted group', className)}
      >
        {facadeActive && (
          <>
            {poster ? (
              <img src={poster} alt="Video thumbnail" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setFacadeActive(false)}>
              <div className="h-14 w-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                <div className="w-0 h-0 border-l-[14px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
              </div>
            </div>
          </>
        )}

        {!facadeActive && (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/80 to-muted flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-black/30 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              playsInline
              loop
              muted={isMuted}
              autoPlay
              preload="metadata"
              onLoadedData={() => setIsLoaded(true)}
              onClick={togglePlay}
              className={cn(
                'w-full h-full object-contain transition-opacity duration-300 cursor-pointer',
                isLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />

            {isLoaded && (
              <div 
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-opacity duration-200',
                  isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                )}
                onClick={togglePlay}
              >
                <div className="h-14 w-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  {isPlaying ? (
                    <div className="flex gap-1">
                      <div className="w-1.5 h-5 bg-white rounded-sm" />
                      <div className="w-1.5 h-5 bg-white rounded-sm" />
                    </div>
                  ) : (
                    <div className="w-0 h-0 border-l-[14px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
                  )}
                </div>
              </div>
            )}

            {isLoaded && (
              <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
              >
                {isMuted ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            )}

            {isLoaded && isPlaying && <VideoProgressBar videoRef={videoRef} />}
          </>
        )}
      </div>
    );
  }
);

LazyVideo.displayName = 'LazyVideo';
