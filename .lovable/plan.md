

# Navigation Speed & App-Like Experience Plan

After auditing the 10 steps against the current codebase, the foundations from Phase 7 have already covered most of the heavy lifting: every route is `lazy()`-loaded with a Suspense fallback, `prefetchRoute` exists with a 21-route map, `OptimizedImage` enforces IO + Supabase resize transforms, the page transition is a 250 ms fade-and-slide, no `<a href>` full-reloads exist on internal routes, React Query has `staleTime: 2min` + `gcTime: 10min` + no refetch-on-focus, image cache is capped at 80 entries, `usePrefetch` hook exists, and `Navbar` / `ProductCard` are `memo()`-wrapped. The remaining gaps are real but narrow.

## Findings (priority-ordered)

### HIGH — measurable wins
- **N1 — Prefetch hook is unused.** `usePrefetch` and `prefetchRoute` exist but **only `ProductCard` (shop→product) and `AdminSidebar`** call them. Navbar links, FeaturedProductsGrid, FeaturedCoursesGrid, CourseCard, Footer quick-links, dashboard tiles, and admin header dropdown all skip prefetch. Wire `usePrefetch` into:
  - `Navbar` desktop + mobile links (Shop / Academy / Dashboard / Admin / Auth) — biggest win, every page-to-page hop becomes instant.
  - `CourseCard` → `/course/:id` (academy → detail).
  - Dashboard tiles' "Browse Academy" / "Explore Masterclasses" / "Recent order" CTAs.
- **N2 — `PageLoader` reserves `min-h-[60vh]` of empty space.** When a chunk loads in <100 ms (cached / prefetched) the user still sees a 60vh blank gap before content appears, defeating the prefetch work. Fix: drop the spacer, keep only the top progress bar — Suspense will swap content in instantly when the chunk is ready, and `animate-page-enter` already prevents flash.
- **N3 — Page transition runs on every navigation, even back-button.** The `<div key={pathname}>` re-mounts the entire tree, which discards React Query data (no, query cache is global — fine) but does kill scroll restoration and forces `animate-page-enter` to replay. Fix: keep the animation but shorten to **150 ms** (current 250 ms feels noticeable on fast hops). Already in spec ("under 200 ms").
- **N4 — `CourseCard` uses raw `<img>` (not `OptimizedImage`).** No IO lazy-load, no Supabase transform, no skeleton. Swap to `OptimizedImage` with `preset="medium"` + `aspectRatio={16/9}` to cut payload + prevent CLS on `/academy`.

### MEDIUM — perceived-speed polish
- **N5 — Mobile Sheet nav doesn't prefetch.** When user opens the menu on mobile, we have a 200-300 ms window before they tap a link — perfect prefetch opportunity. Wire `onMouseEnter`/`onTouchStart` on each Sheet `<Link>`.
- **N6 — No prefetch on Admin Header user dropdown** (My Dashboard / Site links). Low-cost win.
- **N7 — `prefetchRoute` map missing entries** for `/auth`, `/forgot-password`, `/track-order`, `/privacy`, `/terms`, `/product/:id`, `/course/:id` (the dynamic ones can prefetch the page chunk via a `/product/` key prefix — already supported by the `startsWith` matcher, but the map needs the keys). Add the keys.

### LOW — already correct, no action
- All routes lazy-loaded ✓
- Suspense fallback present ✓
- React Query caching tuned ✓
- No `<a href>` for internal routes (all use `<Link>` / `navigate()`) ✓
- `OptimizedImage` with IO + Supabase transforms ✓
- Service worker LRU image cache ✓
- 44px touch targets globally ✓
- `Navbar`, `ProductCard`, page tiles already `memo()`-wrapped ✓
- `OfflineIndicator`, ErrorBoundary, scroll-to-top already global ✓
- BrowserRouter (correct for Lovable hosting) ✓
- No layout shift — `AspectRatio` + `aspect-ratio` CSS used everywhere ✓
- Skeletons used for all loading (no spinners on routes) ✓

## Execution scope (~7 files, no new deps, no DB changes)

```
src/lib/imageUtils.ts           (N7 — add /auth, /track-order, /product, /course, /privacy, /terms keys)
src/components/Navbar.tsx       (N1, N5 — wire usePrefetch on every desktop + mobile Sheet link)
src/components/Footer.tsx       (N1 — wire usePrefetch on quickLinks + categories)
src/components/academy/CourseCard.tsx   (N1, N4 — usePrefetch + swap <img> to OptimizedImage)
src/components/admin/AdminHeader.tsx    (N6 — usePrefetch on Site / Dashboard dropdown)
src/components/dashboard/tiles/LearningPathTile.tsx     (N1 — prefetch /academy)
src/components/dashboard/tiles/MasterclassTile.tsx      (N1 — prefetch /academy)
src/components/dashboard/tiles/RecentOrderTile.tsx      (N1 — prefetch /dashboard order link if any)
src/App.tsx                     (N2, N3 — drop 60vh spacer, shorten page-enter to 150 ms via class)
src/index.css                   (N3 — shorten page-enter animation duration to 0.15s)
```

## Out of scope (intentionally)
- **No webp conversion** (Step 6.1) — `OptimizedImage` already uses Supabase's transform endpoint which serves modern formats; bulk re-encoding source assets is a content task, not code.
- **No optimistic UI on cart/wishlist** beyond what's there (Step 8.2) — both contexts already update local state synchronously before any server round-trip.
- **No new transition library** (framer-motion etc.) — existing CSS keyframes are 0 KB and meet "<200 ms" requirement.
- **No skeleton-layout overhaul** — every list page already has a `*Skeleton` component.

## Decision

Reply with one of:
- **"Execute all of this plan"** — full ~10 files, recommended.
- **"Execute N1–N3 only"** — wire prefetch + drop loader spacer + shorten transition, skip CourseCard image swap. ~6 files.
- **"Skip the page-enter shortening"** — keep 250 ms, only do prefetch wiring.

