/**
 * Video embed helpers for the Course player.
 *
 * Returns an object describing how to render a given video URL:
 *   - kind: 'iframe' for YouTube/Vimeo (embeddable), 'video' for direct files
 *   - src:  the URL to feed into <iframe> or <video>
 *   - title: a friendly title for accessibility
 *
 * Returns null if the URL is missing or unsupported.
 */
export type VideoEmbed =
  | { kind: 'iframe'; src: string; title: string }
  | { kind: 'video'; src: string; title: string };

const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'];
const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];
const DIRECT_VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

export function getVideoEmbed(url: string | null | undefined, fallbackTitle = 'Course preview'): VideoEmbed | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();

  // YouTube
  if (YT_HOSTS.includes(host)) {
    let id = '';
    if (host === 'youtu.be') {
      id = parsed.pathname.slice(1);
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.replace('/embed/', '');
    } else if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v') ?? '';
    } else if (parsed.pathname.startsWith('/shorts/')) {
      id = parsed.pathname.replace('/shorts/', '');
    }
    if (!id) return null;
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`,
      title: fallbackTitle,
    };
  }

  // Vimeo
  if (VIMEO_HOSTS.includes(host)) {
    const id = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
    if (!id) return null;
    return {
      kind: 'iframe',
      src: `https://player.vimeo.com/video/${encodeURIComponent(id)}`,
      title: fallbackTitle,
    };
  }

  // Direct video file
  if (DIRECT_VIDEO_EXT.test(parsed.pathname)) {
    return { kind: 'video', src: url, title: fallbackTitle };
  }

  return null;
}
