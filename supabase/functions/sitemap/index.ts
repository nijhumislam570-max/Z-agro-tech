import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Content-Type': 'application/xml',
  'Cache-Control': 'public, max-age=3600',
};

const SITE_URL = 'https://zagrotech.lovable.app';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const urls: SitemapUrl[] = [];
    const now = new Date().toISOString().split('T')[0];

    // Public static pages (admin, dashboard, checkout, cart excluded — see robots.txt)
    const staticPages = [
      { path: '', priority: 1.0, changefreq: 'daily' as const },
      { path: '/shop', priority: 0.9, changefreq: 'daily' as const },
      { path: '/academy', priority: 0.9, changefreq: 'daily' as const },
      { path: '/about', priority: 0.6, changefreq: 'monthly' as const },
      { path: '/contact', priority: 0.6, changefreq: 'monthly' as const },
      { path: '/faq', priority: 0.5, changefreq: 'monthly' as const },
      { path: '/track-order', priority: 0.4, changefreq: 'monthly' as const },
      { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' as const },
      { path: '/terms', priority: 0.3, changefreq: 'yearly' as const },
    ];

    for (const page of staticPages) {
      urls.push({
        loc: `${SITE_URL}${page.path}`,
        lastmod: now,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }

    // Active products
    const { data: products } = await supabase
      .from('products')
      .select('id, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (products) {
      for (const product of products) {
        urls.push({
          loc: `${SITE_URL}/product/${product.id}`,
          lastmod: product.created_at?.split('T')[0] || now,
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    }

    // Active courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(500);

    if (courses) {
      for (const course of courses) {
        urls.push({
          loc: `${SITE_URL}/course/${course.id}`,
          lastmod: course.updated_at?.split('T')[0] || now,
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }

    const xml = generateSitemapXml(urls);
    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>',
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      }
    );
  }
});

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls.map(url => {
    let entry = `  <url>\n    <loc>${escapeXml(url.loc)}</loc>`;
    if (url.lastmod) entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
    if (url.changefreq) entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
    if (url.priority !== undefined) entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
    entry += '\n  </url>';
    return entry;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
