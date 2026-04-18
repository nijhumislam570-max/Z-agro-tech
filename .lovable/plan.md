

# Phase 4 — Krishi Clinic Polish (Carousel + Real Imagery)

Phase 3 already shipped the bento grid + glassmorphism. Phase 4 layers on the missing pieces from the new brief: a swipeable **Carousel** of featured agri-inputs & masterclasses, real Unsplash imagery as fallbacks, richer agri copy, and Skeleton states for every async tile.

## What's already done (Phase 3 — keep)

- Bento grid (`BentoGrid`, `GlassCard`)
- Glass utilities (`.glass`, `.bg-agri-gradient`)
- Tiles: KPI Marquee, Quick Actions, Learning Path, Recommended Inputs, Recent Order, Masterclass
- Hooks: `useRecommendedProducts`, `useFeaturedMasterclass`, `useDashboardKPIs`

## What gets added (Phase 4)

```text
Dashboard layout (12-col → 1-col on mobile)
┌──────────────────────────────────────────────┬──────────────────────┐
│ KPI Marquee  (col-span-12 lg:col-span-8)     │ Quick Actions (4)    │
├──────────────────────────────────────────────┴──────────────────────┤
│ ★ Featured Carousel — col-span-12  (NEW)                            │
│   Swipeable mix of top products + trending masterclasses            │
├──────────────────────┬───────────────────────┬──────────────────────┤
│ Learning Path (5)    │ Recommended Inputs (7)                       │
├──────────────────────┴───────────────────────┬──────────────────────┤
│ Recent Order (8)                             │ Masterclass (4)      │
└──────────────────────────────────────────────┴──────────────────────┘
```

## New files

```text
ADD  src/lib/agriImages.ts
     Curated Unsplash fallback URLs (seeds, fertilizer, pesticide,
     greenhouse, soil, harvest, instructor portraits) + helper
     getProductImage(name|category) / getCourseImage(category).

ADD  src/components/dashboard/tiles/FeaturedCarouselTile.tsx
     Uses shadcn <Carousel> with Embla. Mixes top 3 products +
     top 3 courses into one swipeable strip. Each slide is a
     glass card with image, title, badge (In Stock / Enroll Now,
     difficulty, mode), price/duration, hover lift.
     Skeleton: 3 placeholder slides.

ADD  src/hooks/useFeaturedAgri.ts
     Composes useRecommendedProducts(3) + featured courses(3)
     into a unified `FeaturedItem` array tagged 'product' | 'course'.
```

## Modified files

```text
MODIFY  src/pages/DashboardPage.tsx
        - Insert <FeaturedCarouselTile /> as second row of bento.

MODIFY  src/components/dashboard/tiles/RecommendedInputsTile.tsx
        - Use getProductImage() fallback when image_url missing.
        - Add semantic <Badge> "In Stock" (green) / "Low" (amber).
        - Add hover lift: hover:-translate-y-1 hover:shadow-lg.

MODIFY  src/components/dashboard/tiles/LearningPathTile.tsx
        - Add <Avatar> for instructor (initials fallback).
        - Use getCourseImage() fallback for thumbnails.
        - Polish Progress label ("Lesson 3 of 8 · 38%").

MODIFY  src/components/dashboard/tiles/MasterclassTile.tsx
        - Use getCourseImage() fallback.
        - Difficulty badge color mapped to green/amber/red.

MODIFY  src/components/dashboard/tiles/KPIMarqueeTile.tsx
        - Real copy refresh: "Welcome back, {name} 🌱 Your Krishi
          Clinic is ready" + chips already present.
```

## Component checklist (per brief)

- [x] `Card` / `CardHeader` / `CardTitle` / `CardContent` — already used in tiles.
- [x] `Carousel` — **new** in FeaturedCarouselTile.
- [x] `Progress` — already in LearningPathTile.
- [x] `Avatar` — **new** in LearningPathTile (instructor).
- [x] `Badge` semantic — extended (In Stock / Out of Stock / Enrolled / Difficulty).
- [x] `Skeleton` — already in tiles; added to carousel.
- [x] Hover micro-interactions: `transition-all duration-200 hover:-translate-y-1 hover:shadow-lg` on every clickable card.

## Real copy used

- Carousel header: **"Featured this week"** · subtitle **"Hand-picked agri-inputs & masterclasses from our experts"**
- Product badges: **In Stock · Low Stock · Out of Stock**
- Course badges: **Beginner · Intermediate · Advanced · Online · On-site**
- Section labels stay in English (i18n deferred).

## Imagery strategy

`src/lib/agriImages.ts` exports Unsplash source URLs grouped by intent:

```ts
export const AGRI_IMAGES = {
  product: {
    seed:        'https://images.unsplash.com/photo-1574323347407-...',
    fertilizer:  'https://images.unsplash.com/photo-1625246333195-...',
    pesticide:   'https://images.unsplash.com/photo-1592982537447-...',
    tool:        'https://images.unsplash.com/photo-1585320806297-...',
    default:     'https://images.unsplash.com/photo-1500382017468-...',
  },
  course: {
    plant_doctor:    'https://images.unsplash.com/photo-1530836369250-...',
    smart_farming:   'https://images.unsplash.com/photo-1574943320219-...',
    organic:         'https://images.unsplash.com/photo-1464226184884-...',
    urban_farming:   'https://images.unsplash.com/photo-1592419044706-...',
    plant_protection:'https://images.unsplash.com/photo-1530507629858-...',
    default:         'https://images.unsplash.com/photo-1500595046743-...',
  },
};
```

Fallback resolver: if DB row has `image_url` / `thumbnail_url` → use it; else map `category` → image; else `default`.

## Guardrails honored

- No DB migrations, no route changes, no Layout/Tabs disruption.
- Bento grid still degrades to single column at `< lg`.
- Carousel uses existing shadcn `Carousel` (Embla) — already installed.
- All async tiles get Skeleton placeholders to prevent layout shift.
- Hover transitions strictly `200ms` per brief.

## File-change summary

```text
ADD     src/lib/agriImages.ts
ADD     src/hooks/useFeaturedAgri.ts
ADD     src/components/dashboard/tiles/FeaturedCarouselTile.tsx
MODIFY  src/pages/DashboardPage.tsx
MODIFY  src/components/dashboard/tiles/RecommendedInputsTile.tsx
MODIFY  src/components/dashboard/tiles/LearningPathTile.tsx
MODIFY  src/components/dashboard/tiles/MasterclassTile.tsx
MODIFY  src/components/dashboard/tiles/KPIMarqueeTile.tsx
```

