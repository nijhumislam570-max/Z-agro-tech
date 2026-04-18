import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authentication & Authorization ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user's JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Check admin role
    const { data: userRoles } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = userRoles?.some((r: { role: string }) => r.role === "admin") ?? false;
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Process request (admin verified) ---
    const { urls } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: "urls array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (urls.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 URLs per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for storage uploads
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: { originalUrl: string; storedUrl: string | null; error?: string }[] = [];

    for (const url of urls) {
      if (!url || typeof url !== "string" || !url.startsWith("http")) {
        results.push({ originalUrl: url, storedUrl: null, error: "Invalid URL" });
        continue;
      }

      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "VetMedix-Import/1.0" },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          results.push({ originalUrl: url, storedUrl: null, error: `HTTP ${response.status}` });
          continue;
        }

        const contentType = response.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) {
          results.push({ originalUrl: url, storedUrl: null, error: "Not an image" });
          continue;
        }

        const blob = await response.blob();
        if (blob.size > 5 * 1024 * 1024) {
          results.push({ originalUrl: url, storedUrl: null, error: "Image too large (>5MB)" });
          continue;
        }

        const extMap: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
          "image/svg+xml": "svg",
        };
        const ext = extMap[contentType] || "jpg";
        const fileName = `imports/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, blob, { contentType, upsert: false });

        if (uploadError) {
          results.push({ originalUrl: url, storedUrl: null, error: uploadError.message });
          continue;
        }

        const { data: publicData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        results.push({ originalUrl: url, storedUrl: publicData.publicUrl });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        results.push({ originalUrl: url, storedUrl: null, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("upload-image-url error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
