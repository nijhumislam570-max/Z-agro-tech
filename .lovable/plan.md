

# Phase 3 — Glass Bento Dashboard

Premium UI upgrade for the user `/dashboard`: a 12-column bento grid with glassmorphism over the earthy-green brand, real agri copy, and live Supabase data. No schema changes, no routing changes.

## Scope (visual/layout only)

- Replace `src/pages/DashboardPage.tsx` content with a **Bento Grid** above the existing `Tabs`.
- Add 5 reusable tiles and a glass design system utility.
- Wire tiles to existing hooks (`useMyOrders`, `useEnrollments`) + one tiny new query for recommended products.
- Keep `Tabs` ("My Orders" | "My Courses") below the grid as a deeper drill-down.
- Skeletons for every async tile.

## Bento layout (12-col → 1-col)

```text
Desktop (lg, 12 cols, ~3 rows)
┌──────────────────────────────────────────────┬───────────────────────┐
│ KPI Marquee  (col-span-12 lg:col-span-8)     │ Quick Actions         │
│ "স্বাগতম, {name}" + 3 stat chips             │ (lg:col-span-4)       │
├──────────────────────┬───────────────────────┴───────────────────────┤
│ Learning Path        │ Recommended Inputs                            │
│ (lg:col-span-5)      │ (lg:col-span-7)  3-up product mini-cards      │
│ active course +      │                                               │
│ Progress + Continue  │                                               │
├──────────────────────┴───────────────────────┬───────────────────────┤
│ Recent Order Status   (lg:col-span-8)        │ Featured Masterclass  │
│ latest order, badge, "Track" CTA             │ (lg:col-span-4)       │
└──────────────────────────────────────────────┴───────────────────────┘

Mobile: every tile col-span-12, stacked.
```

## New files

```text
src/components/dashboard/
  GlassCard.tsx              shadcn Card preset: backdrop-blur-md bg-white/10
                             border-white/20 shadow-xl rounded-2xl + dark variant
  BentoGrid.tsx              wrapper: grid grid-cols-12 gap-4 + container padding
  tiles/
    KPIMarqueeTile.tsx       welcome + 3 stat chips (Active Courses, Recent Orders, In Progress)
    LearningPathTile.tsx     latest enrollment → course thumb, instructor Avatar,
                             Progress bar, "Continue Learning" Button
    RecommendedInputsTile.tsx 3 in-stock products, mini ProductCard, "Add to Cart"
    RecentOrderTile.tsx      latest order: status Badge (statusColors), total, Track CTA
    MasterclassTile.tsx      featured course: cover, difficulty Badge, "Enroll" CTA
    QuickActionsTile.tsx     4 link buttons: Shop · Academy · Cart · Track Order

src/hooks/
  useDashboardData.ts        composes useMyOrders + useEnrollments + new
                             useRecommendedProducts (top 3 stock>0, is_active)
                             returns aggregated KPIs for the marquee
```

## Modified files

```text
MODIFY  src/pages/DashboardPage.tsx
        - Adds <BentoGrid> above existing <Tabs>
        - Section heading uses real agri copy:
          "Your Krishi Clinic" / "Personalized for your farm"
        - Tabs labels updated: "AgroShop Orders" | "Academy Enrollments"
MODIFY  src/index.css
        - Add gradient background utility for dashboard:
          .bg-agri-gradient → from emerald-700 via-emerald-500 to-amber-300
        - Add .glass utility for reuse outside Card
```

## Glassmorphism token (in `index.css`)

```css
.glass {
  @apply backdrop-blur-md bg-white/10 border border-white/20 shadow-xl;
}
.bg-agri-gradient {
  background-image: linear-gradient(135deg,
    hsl(142 55% 22%), hsl(142 45% 35%) 45%, hsl(38 70% 60%));
}
```

The dashboard `<main>` gets `bg-agri-gradient` so glass tiles read correctly. Inner text adapts (white-ish on glass, foreground inside opaque sub-cards).

## Real copy used

- Section: **"Your Krishi Clinic Dashboard"**, subtitle **"Personalized inputs and learning for your farm"**
- KPI chips: **Active Courses · Recent Orders · Lessons in Progress**
- Learning Path: **"Continue your masterclass"**
- Recommended: **"Recommended Agri-Inputs"** (filter hint: Seeds · Fertilizers · Pest Control)
- Order tile: **"Latest AgroShop order"**
- Masterclass tile: **"Featured Masterclass — Crop Disease Management"** (uses real course title when available)
- Quick Actions: **Shop AgroInputs · Browse Academy · View Cart · Track Order**

## Data wiring (no schema change)

- `useMyOrders()` → latest order + count for KPI.
- `useEnrollments()` → latest enrollment joined with course for Learning Path; count for KPI.
- New `useRecommendedProducts()` (3 rows): `products` where `is_active=true and stock > 0` order by `is_featured desc, created_at desc` limit 3.
- New `useFeaturedMasterclass()` (1 row): `courses` where `is_active=true` order by `created_at desc` limit 1.
- Skeleton components from `@/components/ui/skeleton` for every tile body.

## Guardrails honored

- No DB migrations. No route changes. No removal of existing Tabs/Orders/Courses tabs.
- Bento grid degrades to single column at `< lg`.
- All buttons use existing shadcn `Button` with the existing 200ms transitions from `button.tsx`.
- Status colors stay consistent with `src/lib/statusColors.ts`.
- Empty states: each tile shows a friendly empty card with a CTA (no blank tiles).

## Out of scope

Payments, video player, course progress tracking logic, instructor portal, reviews, i18n.

## File-change summary

```text
ADD     src/components/dashboard/GlassCard.tsx
ADD     src/components/dashboard/BentoGrid.tsx
ADD     src/components/dashboard/tiles/KPIMarqueeTile.tsx
ADD     src/components/dashboard/tiles/LearningPathTile.tsx
ADD     src/components/dashboard/tiles/RecommendedInputsTile.tsx
ADD     src/components/dashboard/tiles/RecentOrderTile.tsx
ADD     src/components/dashboard/tiles/MasterclassTile.tsx
ADD     src/components/dashboard/tiles/QuickActionsTile.tsx
ADD     src/hooks/useDashboardData.ts
MODIFY  src/pages/DashboardPage.tsx   (mount bento grid + agri copy)
MODIFY  src/index.css                 (.glass + .bg-agri-gradient)
```

