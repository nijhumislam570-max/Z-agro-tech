

# Phase 1 — Codebase Audit Report (Read-Only)

I traced the dependency tree from `main.tsx` → `App.tsx` → all 13 admin pages + 18 public/auth pages, then cross-referenced every file under `src/components`, `src/hooks`, `src/lib`, `src/contexts`, and `src/types` against actual import call sites. Findings below are grouped by **confidence level** so you can approve only what's safe.

## Tier A — SAFE TO DELETE (zero references found)

| # | File | Why safe |
|---|---|---|
| A1 | `src/components/NavLink.tsx` | Re-export wrapper around `react-router-dom`'s NavLink. **Zero imports anywhere.** Sidebar uses `Link`/`NavLink` directly from react-router-dom. |
| A2 | `src/components/shop/ProductCardSkeleton.tsx` | Skeleton component. **Zero imports.** `ShopPage` defines its own inline `ProductCardSkeleton` (memo); `FeaturedProductsGrid` uses `ProductSkeleton` instead. |
| A3 | `src/hooks/useGeocode.ts` | Returns coords from `/geocode` edge function. **Only self-reference.** Checkout uses static `bangladeshRegions` map, not geocoding. |
| A4 | `src/test/example.test.ts` | Vitest scaffold (`expect(true).toBe(true)`). No real assertions. |
| A5 | `src/tailwind.config.lov.json` | Stale Lovable-config artifact. Real config is `tailwind.config.ts` at root. Zero references. |

## Tier B — SAFE TO PRUNE (orphaned exports inside live files)

| # | Symbol | File | Why |
|---|---|---|---|
| B1 | `notifyAdminsOfNewOrder` | `src/lib/notifications.ts` | No-op stub with **zero call sites** (only `createOrderNotification` is used). Keep the file, drop this function. |
| B2 | `AdminMobileNav` props `incompleteOrders`, `unreadMessages` | `src/components/admin/AdminMobileNav.tsx` | Declared in props, **never read** in JSX (only `pendingOrders` is rendered into the badge). Safe to remove from interface + destructure. |

## Tier C — REVIEW (small refactor opportunities, NOT yet recommended for deletion)

These are not strict "dead code" but **redundancies** worth flagging. I'd prefer to leave these for a follow-up sprint rather than touch them now:

| # | Item | Observation | Recommendation |
|---|---|---|---|
| C1 | `src/components/admin/AdminStatCard.tsx` vs `src/components/admin/StatCard.tsx` | Two near-identical stat cards. `StatCard` (icon as ReactNode) used by `AcademyOverview` + `ECommerceOverview`. `AdminStatCard` (icon as component) used by `AdminEcommerceCustomers`. Both shipped, both maintained. | Defer — consolidating means rewriting prop signatures across 3 files. Worth a focused PR later. |
| C2 | `ProductCardSkeleton` defined inline in `ShopPage.tsx` (line 74) | Duplicate of `src/components/shop/ProductCardSkeleton.tsx` (which IS being deleted in A2) | After A2, the inline version stays as the canonical one — no action needed. |
| C3 | `src/components/ProductCard.tsx` (canonical) + `src/components/shop/ProductCard.tsx` (adapter) | The shop adapter exists to map `ShopProduct` shape → canonical props for Featured/Wishlist grids. Adapter is **actively used** by `FeaturedProductsGrid`, `WishlistTab`, `useWishlistProducts`. | Keep both — intentional pattern. |

## What I deliberately INVESTIGATED and confirmed IS used

So you know the audit was thorough — these all looked suspect at first glance but have live call sites:

- **All 35+ shadcn/ui primitives** (`accordion`, `alert-dialog`, `aspect-ratio`, `calendar`, `carousel`, `checkbox`, `collapsible`, `command`, `dialog`, `drawer`, `dropdown-menu`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `sheet`, `switch`, etc.) — all referenced.
- **All 24 hooks** including `useGeocode` (the only orphan), `useFeaturedAgri`, `useInfiniteScroll`, `usePagination` — used.
- **All 5 dashboard tiles** (`FeaturedCarouselTile`, `LearningPathTile`, `MasterclassTile`, `QuickActionsTile`, `RecommendedInputsTile`) — used by `DashboardPage`.
- **All 7 academy components** (`BatchPicker`, `CourseCard`, `CourseCategoryChips`, `CoursePlayer`, `CourseSkeleton`, `CurriculumList`, `EnrollDialog`) — used.
- **All 4 home components** (`HeroSection`, `FeaturedProductsGrid`, `FeaturedCoursesGrid`, `TrustStatsStrip`) — used by `Index.tsx`.
- **All admin dashboard subcomponents** (`AcademyOverview`, `ECommerceOverview`, `OrderStatusHelpers`, `PlatformHealthCard`, `QuickActionsCard`, `RecentOrdersList`, `RecentOrdersSkeleton`) — used.
- **All admin lib files** (`fraudDetection`, `csvParser`, `bangladeshRegions`, `statusColors`, `dbJoins`, `whatsapp`, `videoEmbed`, `mediaCompression`, `notifications`, `supabaseService`, `imageUtils`, `agriImages`, `productCategories`) — used.
- **`src/types/database.ts`** — used by `useAdmin`, `AdminOrders`, `ProductDetailPage`, `fraudDetection`.
- **`AdminMobileNav`, `AdminSidebar`, `AdminHeader`** — all wired to `AdminLayout` / `AdminShell`.
- **`createOrderNotification`** in `notifications.ts` — used by 4 admin order dialogs (no-op, but kept as a shim per the file's own comment).

## Phase 2 — Proposed cleanup plan (only after you approve)

1. Delete the 5 Tier A files.
2. Remove the `notifyAdminsOfNewOrder` export from `notifications.ts`.
3. Remove unused `incompleteOrders` + `unreadMessages` props from `AdminMobileNav` interface + the destructure (and the matching props passed by `AdminHeader`).
4. Run `tsc --noEmit` — must be clean. If anything errors, immediately revert that specific change.

**Touched files (Phase 2):** 5 deletes + 3 edits (`src/lib/notifications.ts`, `src/components/admin/AdminMobileNav.tsx`, `src/components/admin/AdminHeader.tsx`).

**Not touched, per your constraints:** `vite.config.ts`, `tailwind.config.ts`, Supabase schema/RLS, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, `supabase/config.toml`.

**Risk:** very low. Tier A items have **zero string references in the entire `src/` tree**. Tier B items are dead-export pruning that doesn't change runtime behaviour.

Reply with **"approve cleanup"** (or list which tiers/items to skip) and I'll execute Phase 2.

