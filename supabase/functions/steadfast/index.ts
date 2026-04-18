import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vetmedix.lovable.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}

// Check rate limit for a user
function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  // Cleanup old entries every 100 requests
  if (rateLimitMap.size > 100) {
    cleanupRateLimitMap();
  }

  if (!userLimit || userLimit.resetTime < now) {
    // Start new window
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetIn: userLimit.resetTime - now };
  }

  userLimit.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count, resetIn: userLimit.resetTime - now };
}

// Safely parse response from Steadfast API (handles non-JSON responses)
async function safeParseResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // Steadfast sometimes returns plain text errors
    console.error("Non-JSON response from Steadfast:", response.status, text);
    if (!response.ok) {
      return { status: response.status, error: text || "Courier service returned an error" };
    }
    return { status: response.status, error: "Unexpected response from courier service" };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // Apply rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    // Check if user is admin
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const isAdmin = userRoles?.some((r) => r.role === "admin") ?? false;

    const apiKey = Deno.env.get("STEADFAST_API_KEY");
    const secretKey = Deno.env.get("STEADFAST_SECRET_KEY");

    if (!apiKey || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Steadfast API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();
    console.log("Action requested:", action, "by user:", userId, "isAdmin:", isAdmin);

    const headers = {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    };

    // Add rate limit headers to response
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
    };

    let response;
    let result;

    switch (action) {
      case "track_by_consignment": {
        const { consignment_id } = params;
        
        // Validate input
        if (!consignment_id || typeof consignment_id !== "string") {
          return new Response(
            JSON.stringify({ error: "Invalid consignment ID" }),
            { status: 400, headers: responseHeaders }
          );
        }

        // Verify user owns this order or is admin
        const { data: order } = await supabase
          .from("orders")
          .select("id, user_id")
          .eq("consignment_id", consignment_id)
          .single();

        if (!order) {
          return new Response(
            JSON.stringify({ error: "Order not found" }),
            { status: 404, headers: responseHeaders }
          );
        }

        if (order.user_id !== userId && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to track this order" }),
            { status: 403, headers: responseHeaders }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/status_by_cid/${encodeURIComponent(consignment_id)}`, {
          method: "GET",
          headers,
        });
        result = await safeParseResponse(response);
        break;
      }

      case "track_by_tracking_code": {
        const { tracking_code } = params;
        
        // Validate input
        if (!tracking_code || typeof tracking_code !== "string") {
          return new Response(
            JSON.stringify({ error: "Invalid tracking code" }),
            { status: 400, headers: responseHeaders }
          );
        }

        // Verify user owns this order or is admin
        const { data: order } = await supabase
          .from("orders")
          .select("id, user_id")
          .eq("tracking_id", tracking_code)
          .single();

        if (!order) {
          return new Response(
            JSON.stringify({ error: "Order not found" }),
            { status: 404, headers: responseHeaders }
          );
        }

        if (order.user_id !== userId && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to track this order" }),
            { status: 403, headers: responseHeaders }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/status_by_trackingcode/${encodeURIComponent(tracking_code)}`, {
          method: "GET",
          headers,
        });
        result = await safeParseResponse(response);
        break;
      }

      case "track_by_invoice": {
        const { invoice } = params;
        
        // Validate input
        if (!invoice || typeof invoice !== "string") {
          return new Response(
            JSON.stringify({ error: "Invalid invoice ID" }),
            { status: 400, headers: responseHeaders }
          );
        }

        // For invoice tracking, verify user owns an order with this invoice (order id) or is admin
        const { data: order } = await supabase
          .from("orders")
          .select("id, user_id")
          .eq("id", invoice)
          .single();

        if (!order) {
          return new Response(
            JSON.stringify({ error: "Order not found" }),
            { status: 404, headers: responseHeaders }
          );
        }

        if (order.user_id !== userId && !isAdmin) {
          return new Response(
            JSON.stringify({ error: "Unauthorized to track this order" }),
            { status: 403, headers: responseHeaders }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${encodeURIComponent(invoice)}`, {
          method: "GET",
          headers,
        });
        result = await safeParseResponse(response);
        break;
      }

      case "create_order": {
        // Admin only action
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: responseHeaders }
          );
        }

        const { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = params;
        
        // Validate required inputs
        if (!invoice || !recipient_name || !recipient_phone || !recipient_address) {
          return new Response(
            JSON.stringify({ error: "Missing required order fields" }),
            { status: 400, headers: responseHeaders }
          );
        }

        // Validate phone format (basic check)
        if (typeof recipient_phone !== "string" || recipient_phone.length < 10) {
          return new Response(
            JSON.stringify({ error: "Invalid phone number" }),
            { status: 400, headers: responseHeaders }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            invoice: String(invoice).slice(0, 100), // Limit length
            recipient_name: String(recipient_name).slice(0, 200),
            recipient_phone: String(recipient_phone).slice(0, 20),
            recipient_address: String(recipient_address).slice(0, 500),
            cod_amount: Number(cod_amount) || 0,
            note: note ? String(note).slice(0, 500) : undefined,
          }),
        });
        result = await safeParseResponse(response);
        console.log("Order created by admin:", userId, "invoice:", invoice);
        break;
      }

      case "get_balance": {
        // Admin only action
        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: responseHeaders }
          );
        }

        response = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
          method: "GET",
          headers,
        });
        result = await safeParseResponse(response);
        console.log("Balance checked by admin:", userId);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: responseHeaders }
        );
    }

    // If result contains an error from Steadfast, return appropriate status
    const statusCode = result?.error ? (result.status as number || 502) : 200;
    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    console.error("Steadfast API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
