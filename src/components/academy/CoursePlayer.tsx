import { GraduationCap, PlayCircle } from 'lucide-react';
import { getVideoEmbed } from '@/lib/videoEmbed';

interface Props {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  title: string;
}

/**
 * Sleek 16:9 hero player for the Course Detail page.
 * - If we have an embeddable video URL → render iframe / native <video>
 * - Otherwise → keep the gradient hero (or thumbnail) with a "▶ Preview coming soon" pill
 *   so the affordance is clear.
 */
export const CoursePlayer = ({ videoUrl, thumbnailUrl, title }: Props) => {
  const embed = getVideoEmbed(videoUrl, `${title} — preview`);

  if (embed?.kind === 'iframe') {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-card">
        <iframe
          src={embed.src}
          title={embed.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          // Defense-in-depth: even though embed sources are whitelisted in
          // getVideoEmbed, sandbox prevents form submission, top-level nav,
          // and same-origin access — only video playback + scripts run.
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="w-full h-full border-0"
          loading="lazy"
        />
      </div>
    );
  }

  if (embed?.kind === 'video') {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-card">
        <video
          src={embed.src}
          poster={thumbnailUrl ?? undefined}
          controls
          preload="metadata"
          className="w-full h-full object-contain bg-black"
          aria-label={embed.title}
        />
      </div>
    );
  }

  // Fallback: gradient/thumbnail hero with affordance pill
  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shadow-card">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
      ) : (
        <GraduationCap className="h-24 w-24 text-primary/30" aria-hidden="true" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
      <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-background/85 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-foreground border border-border/60 shadow-sm">
        <PlayCircle className="h-3.5 w-3.5 text-primary" />
        Preview coming soon
      </span>
    </div>
  );
};

export default CoursePlayer;
