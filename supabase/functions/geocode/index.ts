import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Lightweight rate limit (per IP) to protect upstream geocoder
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Simple in-memory cache for repeated queries
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { lat: number; lng: number; display_name?: string; expiresAt: number }>();

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim();
  return ip || "unknown";
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = getClientIp(req);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rate.retryAfterSeconds),
        },
      });
    }

    const body = await req.json().catch(() => ({}));
    const q = typeof body?.q === "string" ? body.q.trim() : "";
    if (!q || q.length < 3 || q.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid query" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = q.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify({ lat: cached.lat, lng: cached.lng, display_name: cached.display_name }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
      });
    }

    // Build progressively simpler queries for fallback.
    // e.g. "Majed Monjil, Pachuria, ..., Gopalganj" -> try full, then last 2 parts, then last 1 part
    const parts = q.split(",").map((s: string) => s.trim()).filter(Boolean);
    const queries: string[] = [q];
    if (parts.length > 2) {
      // Try last 2 comma-separated parts (city + country typically)
      queries.push(parts.slice(-2).join(", "));
    }
    if (parts.length > 1) {
      // Try just the last part
      queries.push(parts[parts.length - 1]);
    }

    let results: Array<{ lat: string; lon: string; display_name?: string }> = [];

    for (const query of queries) {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "1");
      url.searchParams.set("q", query);

      const res = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
        "User-Agent": "ZAgroTech/1.0 (Supabase geocoder)",
        },
      });

      if (!res.ok) continue;

      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
      if (Array.isArray(data) && data.length > 0) {
        results = data;
        break;
      }
    }

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: "No results" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const first = results[0];
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response(JSON.stringify({ error: "Invalid geocode result" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    cache.set(cacheKey, { lat, lng, display_name: first.display_name, expiresAt: Date.now() + CACHE_TTL_MS });

    return new Response(JSON.stringify({ lat, lng, display_name: first.display_name }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
    });
  } catch (error) {
    console.error("Geocode error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
