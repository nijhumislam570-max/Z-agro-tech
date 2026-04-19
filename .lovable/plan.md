

# Customer `/dashboard` — Functionality, Performance & UX Refresh

## What I found (audit)

The dashboard isn't broken — it's a working bento grid — but **it doesn't match the spec**, has **fixable performance and clarity problems**, and the spec's "stats / orders / quick actions / alerts" framing is a much better mental model for a customer hub than the current "7-tile collage."

### Functionality issues
1. **`useMyOrders` selects `*`** — pulls heavy columns (`items` JSONB, `shipping_address`, `rejection_reason`, etc.) for every tile that just needs `id, status, total_amount, created_at, items.length`.
2. **`useMyEnrollments` selects `*, course:courses(*), batch:course_batches(*)`** — fetches every column of every related row when only `title, thumbnail_url, status, progress, batch.name` is rendered.
3. **No `staleTime` on `useMyOrders` / `useMyEnrollments`** — every tab change to dashboard refetches; `useDashboardKPIs` triggers both queries again.
4. **Duplicate fetches**: `useDashboardKPIs` + `RecentOrderTile` + `LearningPathTile` + `OrdersTab` + `CoursesTab` all read the same data via the same hooks. Cache makes that free, but only after staleTime is set.
5. **`KPIMarqueeTile` "Recent Orders" stat = `data.length`** — that's just total orders, not "recent" — misleading label.
6. **Greeting** uses `email.split('@')[0]` — ugly fallback like "nijhumislam570". Profile has `full_name` already loaded by `ProfileTab` but not shared.
7. **No alerts / notifications section** at all (spec STEP 3 bottom).
8. **Tabs default to `orders` but never deep-link** — refresh always lands on Orders even if user came from Wishlist.

### Performance issues
9. The page renders **all 7 hero tiles + a 4-tab Tabs control** on first paint — every dashboard hook (`useMyOrders`, `useMyEnrollments`, `useDashboardKPIs`, `useFeaturedAgri`, `useFeaturedMasterclass`, `useRecommendedProducts`, `useWishlistProducts` lazily) fires in parallel on mount. ~5 round-trips before first interaction.
10. `Carousel` from embla is loaded eagerly even though most users never scroll it.
11. No memoization on tile children — every router push re-renders the bento.

### UX / layout issues
12. The **agri-gradient hero with 7 glass tiles** is *visually heavy* and mixes hierarchy: KPIs, Quick Actions, Featured Carousel, Learning Path, Recommended Inputs, Recent Order, Masterclass — none feels primary.
13. **Recent orders "card" only shows the *latest one*** — spec asks for a list (~3) with View All.
14. Quick Actions sit in the hero but are also duplicated as full pages via tabs.
15. **Mobile (<640px)**: hero is fine but the 4-column Tabs row with text + icons cramps.
16. No empty state for "all caught up" — if you have no orders/enrollments/wishlist the page shows 4 tiles all saying "no data."

## Plan

### Fix A — Slim the data layer (perf, ~3 files)
- `useMyOrders`: select only `id,status,total_amount,created_at,items,tracking_id,payment_method`; add `staleTime: 60_000`.
- `useMyEnrollments`: project a narrow shape `course:courses(id,title,thumbnail_url,category,difficulty,duration_label), batch:course_batches(id,name)`; add `staleTime: 60_000`.
- Add a tiny `useDashboardSummary()` hook that derives **all** stats from the two cached queries (no extra fetch): `totalOrders`, `lifetimeSpend`, `activeCourses`, `completedCourses`, `wishlistCount`, `lowStockAlerts`, `pendingOrders`. Replaces `useDashboardKPIs`.

### Fix B — Restructure the page per spec (UX, 1 page + 1 new section component)
Replace the 7-tile bento collage with the spec's 3-section structure, **keeping the agri-gradient hero** (it's brand-correct) but tightening it:

```
─── HERO (agri-gradient) ────────────────────────────────────────
   Greeting + small "Your farm hub today, <date>"        [Edit profile →]
   ── 4-up StatGrid ─────────────────────────────────────────────
      Total Orders | Lifetime Spend | Active Courses | Wishlist
      (each clickable → /dashboard?tab=orders etc.)
─── BODY ─────────────────────────────────────────────────────────
   ┌── Recent Orders (lg:col-8) ────────┐  ┌── Quick Actions (lg:col-4) ─┐
   │ list of latest 3 orders as cards  │  │ Shop · Academy · Cart · Track│
   │ + "View all" → orders tab         │  │                              │
   └────────────────────────────────────┘  ├── Alerts ────────────────────┤
                                           │ • N pending orders          │
                                           │ • Low stock on N saved items│
                                           │ • New masterclass available │
                                           └──────────────────────────────┘
   ┌── Continue Learning (lg:col-6) ────┐  ┌── Recommended Inputs (lg:col-6)┐
   │ latest enrollment + progress      │  │ 3 product cards               │
   └────────────────────────────────────┘  └────────────────────────────────┘
   ┌── Featured this week (full width, carousel kept) ───────────────────┐
   └─────────────────────────────────────────────────────────────────────┘
─── DETAIL TABS (unchanged) ─────────────────────────────────────
   Orders · Courses · Wishlist · Profile  (deep-linkable via ?tab=)
```

### Fix C — Implementation details
- New `src/components/dashboard/DashboardStatGrid.tsx` — 4 clickable stat cards, mobile = 2col, desktop = 4col, semantic colors only.
- New `src/components/dashboard/RecentOrdersList.tsx` — 3 latest orders, card layout, empty state ("No orders yet → Browse shop").
- New `src/components/dashboard/AlertsTile.tsx` — pulls from already-cached queries (no new fetch); shows `pendingOrders > 0`, `wishlist items with stock<5`, `latest masterclass available` — falls back to "All caught up ✨" tile.
- Remove `KPIMarqueeTile`, `FeaturedCarouselTile` (kept), and consolidate `RecentOrderTile` (single) into the new `RecentOrdersList`.
- Greeting reads `profile.full_name` via existing `useProfile` (already cached), falls back to email handle only if profile empty.
- Tabs gain `?tab=orders|courses|wishlist|profile` deep linking.
- Memoize the heavy tiles (`React.memo` + stable props).

### Fix D — Mobile polish
- Stat grid: `grid-cols-2 lg:grid-cols-4` with bigger numbers.
- Tabs row: keep icons, hide labels <sm (already done).
- Remove `bg-[radial-gradient]` overlay — purely decorative cost.
- Reduce hero padding on mobile (`py-6 md:py-10` instead of `py-8 md:py-10`).

## Out of scope
- Charts (spec says "lightweight or summaries" — the StatGrid + Alerts replace this; recharts is heavy and unnecessary for a customer hub).
- Adding new data points (revenue trends, conversion etc.) — not relevant for a buyer.
- Touching tab content (`OrdersTab`, `CoursesTab`, `WishlistTab`, `ProfileTab` already work).

## Files Touched
| File | Change |
|---|---|
| `src/hooks/useMyOrders.ts` | Narrow select + staleTime |
| `src/hooks/useEnrollments.ts` | Narrow joined select + staleTime on `useMyEnrollments` |
| `src/hooks/useDashboardData.ts` | Add `useDashboardSummary()`, deprecate `useDashboardKPIs` |
| `src/components/dashboard/DashboardStatGrid.tsx` | **NEW** — 4 clickable stat cards |
| `src/components/dashboard/RecentOrdersList.tsx` | **NEW** — top-3 order cards + view all |
| `src/components/dashboard/AlertsTile.tsx` | **NEW** — derived alerts, empty-state fallback |
| `src/pages/DashboardPage.tsx` | Restructured per spec; tabs deep-linkable; memoized tiles |
| `src/components/dashboard/tiles/KPIMarqueeTile.tsx` | **DELETED** (replaced by hero greeting + StatGrid) |
| `src/components/dashboard/tiles/RecentOrderTile.tsx` | **DELETED** (replaced by RecentOrdersList) |

Tiles **kept as-is**: `FeaturedCarouselTile`, `LearningPathTile`, `MasterclassTile`, `RecommendedInputsTile`, `QuickActionsTile`. They already work; spec doesn't require touching them.

## Decision

Reply with one of:
- **"Execute the full plan"** — recommended, ~9 files, full restructure.
- **"Just do Fix A + Alerts"** — keep current bento, only slim queries and add the alerts tile.
- **"Skip the page restructure, only fix data layer"** — Fix A only, 3 files.

