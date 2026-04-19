
The user wants a longer, richer landing page with more sections and better design. Looking at the current `Index.tsx`, it has: Hero → 3 value props → Featured Products → Featured Courses → Trust Stats. That's thin for a modern agritech landing page.

**Plan: Expand landing page with 5 new sections + redesign existing ones**

### New page flow (top → bottom)
1. **Hero** (redesign — add real agriculture image backdrop + dual stat pills)
2. **Trust logos / partners strip** (NEW — "Trusted by 5,000+ farmers across Bangladesh")
3. **Value props bento** (redesign — 6 cards in asymmetric bento grid instead of 3 flat cards)
4. **Featured Products** (keep, polish header)
5. **Categories showcase** (NEW — 4 visual category cards: Crops · Livestock · Fertilizer · Equipment, linking to filtered shop)
6. **Featured Courses** (keep, polish header)
7. **How it works** (NEW — 3-step visual: Browse → Order/Enroll → Grow)
8. **Testimonials** (NEW — 3 farmer testimonial cards with avatar, name, location, quote)
9. **Stats strip** (keep, redesign with image backdrop)
10. **Newsletter / CTA banner** (NEW — full-width gradient CTA: "Join the modern farming movement" with email capture → toast)
11. **FAQ teaser** (NEW — 4 collapsible Q&As linking to /faq)

### Files to create
1. `src/assets/hero-agriculture-field.jpg` — generated cinematic Bangladesh rice/crop field at golden hour
2. `src/components/home/CategoriesShowcase.tsx` — 4 category cards with image+overlay, links to `/shop?category=<slug>`
3. `src/components/home/HowItWorks.tsx` — 3-step horizontal timeline with icons (Search/ShoppingBag/Sprout)
4. `src/components/home/Testimonials.tsx` — 3 testimonial cards (hardcoded realistic Bangladeshi farmer quotes)
5. `src/components/home/NewsletterCTA.tsx` — gradient banner with email input + Subscribe button (toast on submit, no backend)
6. `src/components/home/FAQTeaser.tsx` — 4 Accordion items + "View all FAQs" link to `/faq`
7. `src/components/home/PartnersStrip.tsx` — horizontal strip of trust badges (Free shipping · COD · Verified experts · 24/7 support)

### Files to modify
1. `src/components/home/HeroSection.tsx` — add real ag image as background layer (with gradient overlay for text contrast), add inline mini stat pills below CTAs ("5,000+ farmers · 40+ courses · 98% satisfaction")
2. `src/components/home/TrustStatsStrip.tsx` — redesign with image backdrop + larger numbers
3. `src/pages/Index.tsx` — add new value-props bento layout (6 items, asymmetric); compose all new sections in order

### Design rules I'll follow
- All semantic tokens only (no raw `bg-green-500` etc.) — per Core memory
- Mobile-first responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N`
- 44px min touch targets
- `animate-page-enter` / `animate-fade-in` with staggered delays
- Reuse existing `Card`, `Button`, `Accordion`, `Input` from shadcn
- Images via `OptimizedImage` where appropriate
- One `<h1>` only (in HeroSection); all new sections use `<h2>` with proper `aria-labelledby`

### Image generation (1 new image)
- Cinematic wide shot of green Bangladesh rice paddies at golden hour with soft mist, warm tones — fits the warm beige theme. Generated via Nano banana 2 (`google/gemini-3.1-flash-image-preview`) for speed + quality. Saved to `src/assets/`.

### What I'm NOT doing
- No backend for newsletter (toast-only — can wire to a `subscribers` table later if requested)
- No new routes
- No DB/migrations
- Not touching admin, auth, or shop logic
- Not adding the `@tailwindcss/container-queries` plugin

Reply **"approve"** and I'll execute.
