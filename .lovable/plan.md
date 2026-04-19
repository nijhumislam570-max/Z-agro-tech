

# Admin Panel Navigation Speed Plan

After auditing the admin layer against the 10-step spec, **most of the work is already done** from the prior nav-speed sprint. Let me lay out what's already shipped vs. what's actually missing.

## Audit Results

**Already shipped (no changes needed):**
- ✅ **Step 2 Code-split**: every admin page in `App.tsx` is `lazy()`-loaded behind Suspense
- ✅ **Step 3 Transitions**: `PageTransition` keyed on pathname runs the global 180ms `animate-page-enter` fade
- ✅ **Step 4 Caching**: `QueryClient` defaults are `staleTime: 2min`, `gcTime: 10min`, `refetchOnWindowFocus: false`
- ✅ **Step 8 Loading bar**: `PageLoader` top progress bar already shown during chunk fetch
- ✅ **Step 9 Layout shell**: `AdminLayout` is rendered *inside* each page (not above), but sidebar collapsed-state persists in localStorage so it appears stable
- ✅ **Step 10 Skeletons**: `OrdersSkeleton`, `ProductsSkeleton`, `EnrollmentsSkeleton`, `AnalyticsSkeleton`, `TableSkeleton` all exist

**Actual bottlenecks found:**
1. `AdminSidebar` links use raw `<NavLink>` → no chunk prefetch on hover (public nav already has this via `usePrefetch`)
2. `prefetchRoute` map in `src/lib/imageUtils.ts` covers public routes but is **missing every `/admin/*` route** — hover prefetch silently no-ops
3. `AdminLayout` is **re-mounted on every admin route change** (each page wraps its own `<AdminLayout>`), causing the sidebar's `useQuery(['admin-pending-counts'])` to re-run and the collapse animation to flash. This is the biggest perceived-lag source.
4. `useAdminStats` on dashboard refetches on every visit (no `staleTime` override) — fine but means dashboard feels heavy when bouncing back to it

## Plan (3 focused fixes, ~5 files)

### Fix A — Add admin routes to prefetch map *(1 file)*
Append all 14 `/admin/*` paths to the `routeMap` in `src/lib/imageUtils.ts` so hover-prefetch works.

### Fix B — Wire `usePrefetch` into AdminSidebar *(1 file)*
Spread `usePrefetch(item.href)` onto each sidebar `<NavLink>` so hovering an admin link starts loading its chunk before the click.

### Fix C — Stop AdminLayout from remounting *(2 files + route refactor)*
Convert `/admin/*` routes in `App.tsx` to a **nested route** with `AdminLayout` as the parent element using React Router's `<Outlet />`. Each admin page then exports just its inner content, and the sidebar/header/pending-count query stay mounted across navigations.

```text
Before:                          After:
<AdminDashboard>                 <Route path="/admin" element={<RequireAdmin><AdminLayout/></RequireAdmin>}>
  <AdminLayout>                    <Route index element={<AdminDashboard/>}/>
    ...page...                     <Route path="orders" element={<AdminOrders/>}/>
  </AdminLayout>                   ...
</AdminDashboard>                </Route>
```

This single change eliminates: sidebar remount flash, pending-count re-fetch on every nav, and AdminHeader prop re-derivation — the actual reasons admin nav feels heavy.

### Fix D — Tighten dashboard stats stale time *(1 file)*
Add `staleTime: 60_000` to `useAdminStats` so jumping back to `/admin` from `/admin/orders` shows cached numbers instantly while a background refresh runs.

## Out of Scope (already good or not the bottleneck)

- Virtualization — current pages paginate (50/page in Orders, infinite scroll in Products); no admin list ships >100 rows at once
- Splitting tables further — `OrderStatsBar`, `ProductStatsBar` etc. are already memoized
- Adding a new motion library — keep the 180ms CSS keyframe, it's free and meets the <200ms bar
- Sidebar redesign — Phase 7 already polished it

## Files Touched

1. `src/lib/imageUtils.ts` — add 14 admin routes to `routeMap`
2. `src/components/admin/AdminSidebar.tsx` — spread `usePrefetch(href)` on each link
3. `src/App.tsx` — restructure `/admin/*` as nested routes around shared `AdminLayout`
4. `src/components/admin/AdminLayout.tsx` — render `<Outlet/>` instead of `children`, drop `title`/`subtitle` props (each page sets its own header via a tiny `useAdminPageMeta` or just renders its own page header — simpler: keep `<AdminLayout>` content-only, move title/subtitle into each page's first child)
5. All 14 admin page files — unwrap the outer `<AdminLayout>...</AdminLayout>` and render their content directly with a small page header block

## Decision

Reply with one of:
- **"Execute all of this plan"** — full ~17 files (5 core + 12 admin page unwraps), recommended.
- **"Skip the layout-remount refactor"** — only Fixes A, B, D (3 files). Quicker, keeps minor remount flash.
- **"Just prefetch (Fix A + B)"** — 2 files, smallest delta.

