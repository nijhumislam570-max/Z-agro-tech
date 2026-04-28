import * as Sentry from "npm:@sentry/deno";

const sentryDsn = Deno.env.get("SENTRY_DSN");
let sentryInitialized = false;

function clampSampleRate(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "authorization" ||
      lowerKey === "cookie" ||
      lowerKey === "apikey" ||
      lowerKey === "x-api-key"
    ) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

export function initEdgeSentry(functionName: string): void {
  if (!sentryDsn || sentryInitialized) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "production",
    release: Deno.env.get("SENTRY_RELEASE") ?? undefined,
    sendDefaultPii: false,
    tracesSampleRate: clampSampleRate(
      Deno.env.get("SENTRY_TRACES_SAMPLE_RATE"),
      0.2,
    ),
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
        delete event.user.ip_address;
      }

      if (event.request?.headers) {
        event.request.headers = sanitizeHeaders(
          new Headers(event.request.headers as HeadersInit),
        );
      }

      if (event.request?.url) {
        event.request.url = sanitizeUrl(event.request.url);
      }

      return event;
    },
  });

  sentryInitialized = true;
  Sentry.setTag("runtime", "supabase-edge");
  Sentry.setTag("supabase.function", functionName);
}

export async function captureEdgeException(
  functionName: string,
  error: unknown,
  request: Request,
  extra?: Record<string, unknown>,
): Promise<void> {
  if (!sentryDsn) {
    return;
  }

  initEdgeSentry(functionName);

  Sentry.withScope((scope) => {
    scope.setTag("supabase.function", functionName);
    scope.setContext("request", {
      method: request.method,
      url: sanitizeUrl(request.url),
      headers: sanitizeHeaders(request.headers),
    });

    if (extra) {
      scope.setContext("extra", extra);
    }

    Sentry.captureException(error);
  });

  await Sentry.flush(2000);
}

export async function withSentry(
  functionName: string,
  request: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  if (!sentryDsn) {
    return handler();
  }

  initEdgeSentry(functionName);
  const url = new URL(request.url);

  return await Sentry.startSpan(
    {
      name: `${request.method} ${url.pathname}`,
      op: "http.server",
    },
    async () => {
      try {
        const response = await handler();
        Sentry.addBreadcrumb({
          category: "http",
          message: `${request.method} ${url.pathname}`,
          level: response.status >= 500 ? "error" : "info",
          data: {
            function: functionName,
            status: response.status,
          },
        });
        return response;
      } catch (error) {
        await captureEdgeException(functionName, error, request);
        throw error;
      }
    },
  );
}
