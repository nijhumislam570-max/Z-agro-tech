import * as Sentry from '@sentry/react';
import { supabase } from '@/integrations/supabase/client';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const defaultTraceRate = import.meta.env.DEV ? 1 : 0.2;

function clampSampleRate(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

function sanitizeRequestHeaders(headers: Record<string, unknown> | undefined) {
  if (!headers) return headers;

  const sanitized = { ...headers };
  delete sanitized.authorization;
  delete sanitized.Authorization;
  delete sanitized.apikey;
  delete sanitized['x-api-key'];
  delete sanitized.cookie;
  delete sanitized.Cookie;

  return sanitized;
}

export function initSentry(): void {
  if (!sentryDsn || Sentry.getClient()) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    environment:
      import.meta.env.VITE_SENTRY_ENVIRONMENT ||
      (import.meta.env.DEV ? 'development' : 'production'),
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.supabaseIntegration({ supabaseClient: supabase }),
    ],
    tracePropagationTargets: [
      window.location.origin,
      /^https:\/\/[a-z0-9-]+\.supabase\.co/i,
    ],
    tracesSampleRate: clampSampleRate(
      import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
      defaultTraceRate,
    ),
    ignoreErrors: [
      'ResizeObserver loop completed with undelivered notifications.',
      'ResizeObserver loop limit exceeded',
    ],
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }

      if (event.request?.headers) {
        event.request.headers = sanitizeRequestHeaders(
          event.request.headers as Record<string, unknown>,
        );
      }

      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          event.request.url = `${url.origin}${url.pathname}`;
        } catch {
          // Keep the original value if URL parsing fails.
        }
      }

      return event;
    },
  });
}

export function isSentryEnabled(): boolean {
  return Boolean(sentryDsn && Sentry.getClient());
}

export function captureException(
  error: unknown,
  captureContext?: Sentry.CaptureContext,
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.captureException(error, captureContext);
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.captureMessage(message, level);
}

export function setSentryUser(user: { id: string } | null): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setUser(user);
}

export function setSentryRoute(route: string): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setTag('route', route);
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: route,
    level: 'info',
  });
}
