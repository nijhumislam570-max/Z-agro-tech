
The user wants me to use the listed design vocabulary (shapes, components, visual elements) to elevate the landing page sections. The current landing page works but feels flat — most cards are plain rounded rectangles with gradient fills. I'll inject more shape variety, depth, and hierarchy.

## Design moves per section

**1. Hero**
- Add floating decorative shapes (hexagon, circle, triangle) as soft background accents using CSS only (SVG or `clip-path`)
- Add a thin animated divider line under the headline
- Convert the badge above headline to a pill with a tiny pulsing status dot (circle)
- Stat pills get subtle elevation (shadow-lg) + hover lift

**2. PartnersStrip**
- Replace flat row with rounded-rectangle items that have hover elevation
- Add a thin vertical divider (line) between items on desktop
- Add a soft gradient top border (1px) to separate from hero

**3. Value Props Bento (in Index.tsx)**
- Add a hexagonal icon container option (using clip-path) on the two large bento cards for visual variety vs square icon containers on small cards
- Add a "NEW" / accent pill chip in the corner of the primary cards
- Add subtle dotted-pattern texture overlay (CSS radial-gradient dots) on large cards for depth
- Cards get a top-left corner accent shape (small triangle/circle) as decoration

**4. CategoriesShowcase**
- Add a number badge (circle) "01, 02, 03, 04" in top-right corner of each card
- Add an arrow line that extends on hover (animated)
- Add a thin progress bar at bottom of each card showing "popularity" (decorative)

**5. HowItWorks**
- Convert step numbers to large pentagon/hexagon shape badges instead of circles
- Add a dashed connecting line between steps on desktop (instead of solid)
- Add tooltip-style speech bubbles with mini-stats on each step

**6. Testimonials**
- Add a large decorative quotation mark (SVG) in the background of each card
- Convert avatars to circles with a colored ring (border-4)
- Add a 5-star rating row using filled star icons
- Add a small "verified" badge chip next to name

**7. TrustStatsStrip**
- Add hexagonal stat containers instead of plain rounded rectangles
- Add a thin animated progress bar under each stat (decorative)
- Add corner triangles as decorative accents

**8. NewsletterCTA**
- Add floating geometric shapes (circles, triangles, hexagons) in background
- Convert the email input to pill shape (rounded-full)
- Add a small "100% free" badge chip under the form

**9. FAQTeaser**
- Add a large decorative "?" symbol in background
- Add chevron arrows that rotate on expand
- Add a numbered circle badge before each question

## Files to modify (8)
1. `src/components/home/HeroSection.tsx` — floating shapes, status dot, divider
2. `src/components/home/PartnersStrip.tsx` — dividers, hover lift
3. `src/pages/Index.tsx` — bento accents, hexagon icons on large cards, NEW pill
4. `src/components/home/CategoriesShowcase.tsx` — number badges, hover arrow
5. `src/components/home/HowItWorks.tsx` — hexagon step badges, dashed connector
6. `src/components/home/Testimonials.tsx` — quote bg, avatar ring, stars, verified badge
7. `src/components/home/TrustStatsStrip.tsx` — hex containers, corner accents
8. `src/components/home/NewsletterCTA.tsx` — floating shapes, pill input, free badge
9. `src/components/home/FAQTeaser.tsx` — bg "?", numbered badges

## Constraints I'll follow
- All semantic tokens only (no raw `bg-green-500` etc.)
- All shapes via Tailwind + inline `clip-path` (no new deps)
- Mobile-first; decorative shapes hidden on small screens where they'd crowd
- 44px min touch targets preserved
- All decorative elements `aria-hidden="true"`
- No new files, no new images, no DB changes

Reply **"approve"** and I'll execute.
