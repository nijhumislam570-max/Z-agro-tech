

# Phase 7 — Performance & Resilience Plan

After auditing bundle splitting, render-cost, error boundaries, and offline behavior, the platform is **already in solid shape**: every route is lazy-loaded, React Query caching is granular, `OfflineIndicator` is mounted globally, `ErrorBoundary` auto-recovers from chunk-load failures (stale deploy), images use `loading="lazy"`, and `OptimizedImage` enforces IO + CLS prevention. The genuine gaps are narrow and concentrated in **3 heavy admin dialogs that ship eagerly**, **2 missing error-boundary boundaries around big pages**, and **a handful of repeated `.filter()` chains that should be memoized**.

## Findings (priority-ordered)

### HIGH — real bottlenecks
- **B1 — `PDFImportDialog` (451 LOC) and `CSVImportDialog` (306 LOC) are eagerly imported by `AdminProducts`** even though the dialogs only render when the admin clicks "Import". Both pull in CSV/PDF parsing helpers. Lazy-load with `lazy()` + `<Suspense>` so the initial AdminProducts chunk drops by ~25-30 KB gzipped.
- **B2 — `AdminRecoveryAnalytics` imports recharts at the top level** (`import { BarChart, Bar, LineChart, … } from 'recharts'`) — recharts is ~95 KB gzipped. `AdminAnalytics` already lazy-loads its chart panel via `lazy(() => import('@/components/admin/analytics/AnalyticsCharts'))` — apply the same pattern here. Extract the recharts JSX into `src/components/admin/analytics/RecoveryCharts.tsx`, lazy-load it.
- **B3 — `CurriculumEditor` and `FraudAnalysisPanel` ship in their parent route chunks.** Both are conditional: `CurriculumEditor` only renders inside the AdminCourses dialog, `FraudAnalysisPanel` only on the order detail panel. Lazy-load both.
- **B4 — No ErrorBoundary on `/checkout` or `/dashboard`.** A render error in CheckoutPage or DashboardPage crashes the whole app to the global fallback (which says "go home"). These two flows are revenue/identity critical — wrap each in its own `<ErrorBoundary>` so the user can retry without losing cart/route state. (The global one in `App.tsx` stays as the outer net.)

### MEDIUM — micro-perf & resilience
- **R1 — `ProductDetailPage` uses `useParams()` without typing or null-check on `id`**. If somehow `:id` is empty, the query runs with `undefined` and we hit Supabase with a malformed eq. Fix: `const { id } = useParams<{ id: string }>(); if (!id) return <Navigate to="/shop" replace />;`
- **R2 — `ShopPage` re-runs the same `.filter(p => p.image_url && p.is_active !== false)` 3× inside the same `useMemo` for the featured row.** Fold them into a single pass — saves O(n) on every product list update. Tiny but free.
- **R3 — `OfflineIndicator` triggers a re-render on every mount because `setShowReconnected(true)` runs unconditionally inside `handleOnline`** even when the user was never offline. Already guarded by `wasOffline`, just move the timeout into `useEffect` cleanup so we don't leak the timer if the user toggles network rapidly.
- **R4 — Service worker caches images but `OptimizedImage` already builds URLs with width params** — when a different preset is requested for the same source, we over-cache variants. Add a small `cleanupOldVariants` step in `sw.js` that caps the image cache at 80 entries (LRU-ish).

### LOW — already correct, no action
- All public + admin routes lazy-loaded ✓
- React Query v5 with `staleTime` and `gcTime` tuned, retries=1, no refetch-on-focus ✓
- Manual chunk splits: vendor-react / vendor-supabase / vendor-date ✓
- `OfflineIndicator` mounted in App ✓
- `ErrorBoundary` handles chunk-load reload + Sentry-style trackError ✓
- `AdminAnalytics` already wraps in ErrorBoundary + lazy charts ✓
- `useMemo`/`useCallback`/`memo()` used in 40+ files where it matters ✓
- Realtime invalidation is granular by query-key, not blanket `invalidateAll` ✓
- CourseDetailPage handles `course not found` with friendly UI ✓
- 404 NotFound page exists ✓

## Execution scope (~7 files, no new deps)

```
src/pages/admin/AdminProducts.tsx         (B1 — lazy PDFImportDialog + CSVImportDialog with Suspense)
src/pages/admin/AdminOrders.tsx           (B3 — lazy FraudAnalysisPanel)
src/pages/admin/AdminCourses.tsx          (B3 — lazy CurriculumEditor)
src/components/admin/analytics/RecoveryCharts.tsx   (NEW — extract recharts JSX)
src/pages/admin/AdminRecoveryAnalytics.tsx (B2 — use lazy RecoveryCharts + ErrorBoundary)
src/pages/CheckoutPage.tsx                (B4 — wrap content in <ErrorBoundary>)
src/pages/DashboardPage.tsx               (B4 — wrap tabs in <ErrorBoundary>)
src/pages/ProductDetailPage.tsx           (R1 — typed useParams + redirect on missing id)
src/pages/ShopPage.tsx                    (R2 — single-pass filter for featured)
src/components/OfflineIndicator.tsx       (R3 — cleanup timeout in effect)
public/sw.js                              (R4 — cap image cache at 80 entries)
```

## Out of scope (intentionally)
- **No virtualization** (react-window) — biggest list (Shop) uses infinite scroll with skeletons; admin tables paginate at ≤25 rows. Not warranted.
- **No Suspense data boundaries** — react-query `useQuery` has its own `isLoading` flow, switching would require rewrites for marginal gain.
- **No service-worker rewrite** — current network-first strategy is correct; only adding LRU cap.
- **No splitting of AdminOrders (1082 LOC) / AdminProducts (878 LOC) into sub-pages** — they're monolithic but cohesive; would risk regression for ~minor maintainability win. Flag for a future refactor sprint.
- **No framer-motion / page-transition library** — Phase 5 already settled this.
- **No global Sentry integration** — `trackError` already pipes to analytics.

## Decision

Reply with one of:
- **"Execute all of Phase 7"** — full ~10 files, recommended.
- **"Execute B1–B4 only"** — bundle splits + critical error boundaries, skip the R-tier polish. ~6 files.
- **"Skip B4 nested boundaries"** — keep only the global ErrorBoundary, do everything else.

