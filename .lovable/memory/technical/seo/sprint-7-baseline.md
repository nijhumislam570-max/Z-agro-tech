---
name: SEO Baseline (Sprint 7)
description: Public-site SEO standards — sitemap, JSON-LD schemas, OG tags, canonical URLs for Z Agro Tech
type: feature
---

# Sprint 7 SEO Finalization

## Sitemap
- Edge function: `supabase/functions/sitemap/index.ts`
- URL: `https://agxayculciqwhaoaillq.supabase.co/functions/v1/sitemap`
- CORS: `*` (sitemap must be crawlable by Google/Bing)
- Site host: `https://zagrotech.lovable.app`
- Includes: static public pages + active products + active courses (`is_active = true`)
- Excludes: `/admin`, `/dashboard`, `/checkout`, `/cart` (also blocked in `public/robots.txt`)
- Cache: 1 hour (`Cache-Control: public, max-age=3600`)

## JSON-LD Schemas (`src/components/SEO.tsx`)
Supported schema types via the `schema` prop:
- **Organization** — wired to `Index.tsx` (homepage)
- **LocalBusiness** — available
- **Product** — wired to `ProductDetailPage.tsx` (price, availability, brand, rating)
- **Course** — wired to `CourseDetailPage.tsx` (price BDT, language, difficulty, duration, provider)
- **BreadcrumbList** — available, not yet wired

All schemas auto-inject `@context: https://schema.org` and clean up on unmount.

## Canonical URLs
Detail pages must pass an absolute `canonicalUrl` (e.g. `https://zagrotech.lovable.app/product/${id}`).
Static pages may omit it; `index.html` provides the site default.

## Stale ref hygiene
- `index.html` and sitemap previously contained `cucxodrbperhbpbdkoyj` and `vetmedix.lovable.app` references — both purged.
- Always use `agxayculciqwhaoaillq` and `zagrotech.lovable.app`.
