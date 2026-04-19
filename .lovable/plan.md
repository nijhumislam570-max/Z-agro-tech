

# Admin Navigation — Final Polish for App-like Feel

## Diagnosis (live profiled, 35s capture across 5 nav clicks)

| Hotspot | Self-time | Root cause |
|---|---|---|
| `diffProperties` + `validateProperty$1` + `warnInvalidARIAProps` | ~4.2s | React **DEV-mode** prop validation on every Link/Icon. Disappears in production builds. |
| `LinkWithRef` (1030ms) + lucide `createElement` (~1470ms) | ~2.5s | `NavLinkItem` receives a **new `itemWithBadge` object literal every render**, defeating `React.memo`. All 17 links + icons re-render on every navigation. |
| `useAdminRealtimeDashboard` order UPDATE handler | invisible but constant | Invalidates `admin-stats` + `admin-orders` + `admin-ecommerce-customers` on every order change → refetch storm during nav. |
| Heavy `select('*')` on Products / Enrollments / Messages | 200-800ms each cold | Pulls every column incl. long descriptions; the list views only need ~10 fields. |
| `animate-page-enter` on `key={pathname}` | ~16ms paint per nav | Animation runs on the new content wrapper — nice polish but adds visible "fade-in" feel. Keep, but speed it up. |

## Fix plan (4 surgical edits, zero behaviour change)

**1. Stabilize sidebar memoization (kill the 2.5s Link/Icon churn)**
- File: `src/components/admin/AdminSidebar.tsx`
- Change: stop creating `itemWithBadge` inline. Pass `item` + `badge` + `badgeVariant` as separate props to `NavLinkItem` so the existing `memo()` actually short-circuits when only the active path changes. Result: only 2 of 17 links re-render per navigation (old-active + new-active).

**2. Narrow heavy admin queries (faster cold loads)**
- File: `src/lib/adminPrefetch.ts` + matching `select(...)` on the 3 page hooks
- Change: replace `select('*')` with explicit column lists for products, enrollments, messages — the same lists the table cells actually read. Cuts payload ~60-80%, cuts JSON parse + render time proportionally.

**3. Targeted realtime invalidation**
- File: `src/hooks/useAdminRealtimeDashboard.ts`
- Change: order UPDATE → only invalidate `admin-orders` (not stats + customers); profile UPDATE → debounce 500ms; product UPDATE → only invalidate when status/stock changes (skip cosmetic edits). Stops the refetch storm that competes with navigation work.

**4. Faster page-enter animation**
- File: `src/index.css` (or wherever `animate-page-enter` is defined)
- Change: reduce duration from 300ms → 120ms and use `transform: none` final state to avoid sub-pixel reflow. Page swaps feel instant instead of fading in.

## What this will NOT touch
- `React.lazy` chunking, `<Suspense>` skeletons, `prefetchAdminRoute` hover handlers — already in place from prior sprints.
- Business logic, data shapes, RLS, or any page's render output.
- Production-only DEV warnings (`diffProperties` etc.) — those are gone in the deployed build.

## Expected result
- Sidebar self-time drops from ~2.5s → ~400ms across 5 navigations (memo finally works).
- Heavy table pages (Products, Messages, Enrollments) paint **40-60% faster on cold visit**.
- Realtime no longer triggers 3 simultaneous refetches per order edit.
- Page swap feels snappy — sub-150ms perceived transition.

## Files touched
- `src/components/admin/AdminSidebar.tsx` (memo fix)
- `src/lib/adminPrefetch.ts` (narrow selects)
- `src/pages/admin/AdminProducts.tsx`, `AdminEnrollments.tsx`, `AdminContactMessages.tsx` (matching select lists)
- `src/hooks/useAdminRealtimeDashboard.ts` (targeted invalidations)
- `src/index.css` (animation duration)

Reply **"approve"** and I'll execute.

