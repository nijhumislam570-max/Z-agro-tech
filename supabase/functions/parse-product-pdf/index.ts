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
    // --- JWT Authentication (admin-only) ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // --- End Authentication ---

    const { pdfBase64, pdfText } = await req.json();

    // Support both base64 PDF (preferred) and pre-extracted text (fallback)
    if (!pdfBase64 && (!pdfText || typeof pdfText !== "string" || pdfText.trim().length < 10)) {
      return new Response(
        JSON.stringify({ error: "PDF content is required. Send pdfBase64 or pdfText." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a product data extraction AI. Extract product information from this PDF document (like a product catalog, price list, invoice, or inventory sheet).

Return a JSON array of products. Each product object must have these fields:
- "name": string (product name, clean and descriptive)
- "description": string or null (brief product description if available)
- "price": number (price as a number, no currency symbols. If in BDT/Taka, keep the number. If not clear, use 0)
- "category": "Pet" or "Farm" (classify based on the product - pet supplies/accessories/food = "Pet", farm/agricultural/livestock = "Farm". Default to "Pet" if unclear)
- "product_type": string or null (subcategory like "Food", "Toys", "Grooming", "Electronics", "Accessories", "Medicine", "Equipment", etc.)
- "stock": number (quantity if mentioned, otherwise default to 100)
- "badge": string or null (like "New", "Sale", "Popular" if applicable, otherwise null)
- "discount": number or null (discount percentage if mentioned, otherwise null)
- "image_url": string or null (if the PDF contains image URLs or links to product images, extract them. Otherwise null)

Rules:
1. Extract ALL products found in the document
2. Clean up product names - remove extra whitespace, standardize capitalization
3. If a product has multiple variants (sizes, colors), create separate entries
4. If price is not found for a product, set it to 0
5. Ignore non-product text like headers, footers, company info
6. Return ONLY the JSON array, no markdown, no explanation
7. Maximum 200 products per extraction
8. If you can see image URLs (http/https links to images) associated with products, include them in image_url

Example output:
[{"name":"Premium Dog Food 5kg","description":"High quality nutrition for adult dogs","price":1200,"category":"Pet","product_type":"Food","stock":100,"badge":null,"discount":null,"image_url":null}]`;

    // Build the message parts
    const userParts: any[] = [];

    if (pdfBase64) {
      userParts.push({
        type: "image_url",
        image_url: {
          url: `data:application/pdf;base64,${pdfBase64}`,
        },
      });
      userParts.push({
        type: "text",
        text: "Extract all products from this PDF document. Return only a JSON array.",
      });
    } else {
      const truncatedText = pdfText!.substring(0, 30000);
      userParts.push({
        type: "text",
        text: `Extract all products from this PDF text content:\n\n${truncatedText}`,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process PDF with AI. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    let products;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      products = JSON.parse(jsonStr);

      if (!Array.isArray(products)) {
        throw new Error("Expected an array of products");
      }

      products = products
        .filter((p: any) => p && typeof p === "object" && p.name)
        .map((p: any) => ({
          name: String(p.name).trim().substring(0, 200),
          description: p.description ? String(p.description).trim().substring(0, 2000) : null,
          price: Math.max(0, Number(p.price) || 0),
          category: p.category === "Farm" ? "Farm" : "Pet",
          product_type: p.product_type ? String(p.product_type).trim().substring(0, 100) : null,
          stock: Math.max(0, Math.round(Number(p.stock) || 100)),
          badge: p.badge ? String(p.badge).trim().substring(0, 50) : null,
          discount: p.discount ? Math.min(100, Math.max(0, Number(p.discount))) : null,
          image_url: p.image_url && typeof p.image_url === "string" && p.image_url.startsWith("http") ? p.image_url.trim() : null,
        }))
        .slice(0, 200);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      return new Response(
        JSON.stringify({
          error: "Could not extract products from this PDF. The content may not contain recognizable product data.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ products, count: products.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-product-pdf error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
