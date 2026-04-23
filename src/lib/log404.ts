import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Records a 404 hit so admins can repair dead links surfaced from emails,
 * partner sites, or stale bookmarks. Best-effort: failures are swallowed —
 * a broken telemetry insert must never block a user's recovery flow.
 *
 * Only writes once per (path + scope) per session to keep the log tidy when
 * a user mashes refresh on a broken URL.
 */
const sentKeys = new Set<string>();

export async function log404(path: string, scope: 'public' | 'admin' = 'public') {
  const key = `${scope}:${path}`;
  if (sentKeys.has(key)) return;
  sentKeys.add(key);

  // Always log to the dev console too — keeps existing DX.
  logger.warn(`[${scope === 'admin' ? 'Admin ' : ''}404]`, path);

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id ?? null;

    await supabase.from('route_404_log').insert({
      path: path.slice(0, 2000),
      scope,
      user_id: userId,
      referrer: typeof document !== 'undefined' ? document.referrer.slice(0, 500) || null : null,
      user_agent:
        typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) || null : null,
    });
  } catch {
    // Telemetry must never throw into the UI.
  }
}
