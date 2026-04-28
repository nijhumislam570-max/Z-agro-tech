import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withSentry } from "../_shared/sentry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ChatMessageContentPart =
  | {
      type: "file";
      file: {
        filename: string;
        file_data: string;
      };
    }
  | {
      type: "text";
      text: string;
    };

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

serve((req) => withSentry("parse-product-pdf", req, async () => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = claimsData.claims.sub;
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { pdfBase64, pdfText } = await req.json();

    if (!pdfBase64 && (!pdfText || typeof pdfText !== "string" || pdfText.trim().length < 10)) {
      return new Response(
        JSON.stringify({ error: "PDF content is required. Send pdfBase64 or pdfText." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const openAiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

    const systemPrompt = `You extract agriculture product data from PDF catalogs, price lists, and inventory sheets.

Return ONLY a JSON array of product objects.

Each product object must include:
- "name": string
- "description": string or null
- "price": number
- "category": "Farm" or "Pet"
- "product_type": string or null
- "stock": number
- "badge": string or null
- "discount": number or null
- "image_url": string or null

Rules:
1. Extract every product you can confidently identify.
2. Clean product names and remove extra whitespace.
3. If a product has multiple variants, create separate entries.
4. If a price is missing, use 0.
5. Ignore headers, footers, invoice totals, and company profile text.
6. Default category to "Farm" if unclear.
7. Default stock to 100 if not stated.
8. Return at most 200 products.
9. Return raw JSON only, with no markdown fence and no explanation.`;

    const userParts: ChatMessageContentPart[] = [];

    if (pdfBase64) {
      userParts.push({
        type: "file",
        file: {
          filename: "catalog.pdf",
          file_data: pdfBase64,
        },
      });
      userParts.push({
        type: "text",
        text: "Extract all products from this PDF and return only a JSON array.",
      });
    } else {
      const truncatedText = String(pdfText).substring(0, 30000);
      userParts.push({
        type: "text",
        text: `Extract all products from this PDF text content and return only a JSON array:\n\n${truncatedText}`,
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openAiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userParts },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "OpenAI rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "OpenAI authentication failed. Check OPENAI_API_KEY." }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process PDF with AI. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json() as OpenAIChatResponse;
    const content = data.choices?.[0]?.message?.content ?? "[]";

    let products: Array<{
      name: string;
      description: string | null;
      price: number;
      category: "Farm" | "Pet";
      product_type: string | null;
      stock: number;
      badge: string | null;
      discount: number | null;
      image_url: string | null;
    }>;

    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(jsonStr) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("Expected an array of products");
      }

      products = parsed
        .filter((item): item is Record<string, unknown> => (
          !!item && typeof item === "object" && typeof item.name === "string"
        ))
        .map((item) => ({
          name: String(item.name).trim().substring(0, 200),
          description: item.description ? String(item.description).trim().substring(0, 2000) : null,
          price: Math.max(0, Number(item.price) || 0),
          category: item.category === "Pet" ? "Pet" : "Farm",
          product_type: item.product_type ? String(item.product_type).trim().substring(0, 100) : null,
          stock: Math.max(0, Math.round(Number(item.stock) || 100)),
          badge: item.badge ? String(item.badge).trim().substring(0, 50) : null,
          discount: item.discount ? Math.min(100, Math.max(0, Number(item.discount))) : null,
          image_url:
            typeof item.image_url === "string" && item.image_url.startsWith("http")
              ? item.image_url.trim()
              : null,
        }))
        .slice(0, 200);
    } catch (_parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      return new Response(
        JSON.stringify({
          error: "Could not extract products from this PDF. The content may not contain recognizable product data.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ products, count: products.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("parse-product-pdf error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}));
