

# Admin Navigation Speed & Polish Upgrade

## Goal
Make admin navigation feel instant and app-like across all 13 admin pages — without touching their business logic or data fetching.

## Current state (verified)

- **Routing:** `App.tsx` already uses `React.lazy` for every admin page and a single persistent `<AdminShell />` mounted under `/admin` (good — no shell remount).
- **Suspense fallback:** Currently a thin progress bar at the top of the screen. Page area goes blank during chunk load → looks slow.
- **Sidebar links:** `AdminSidebar.tsx` uses `<NavLink>` (good) but has **no hover prefetch** for either route chunks or query data.
- **Page transitions:** `AdminShell` keys its `<main>` by pathname with `animate-page-enter` (CSS). No `AnimatePresence` exit animation, so leaving page = hard cut, entering page = fade.
- **Query cache:** `QueryClient` already has `staleTime: 2min`, `gcTime: 10min` → stale-while-revalidate works. Just needs prefetch wiring.
- **`framer-motion`:** Already in `package.json` (used elsewhere). No new dependency.

So the missing pieces are: (1) a real Suspense skeleton, (2) AnimatePresence wrapper, (3) hover prefetch for both route chunks AND query data.

## Plan

### Step 1 — Suspense skeleton inside AdminShell
Add a dedicated `<AdminPageSkeleton />` component (shadcn `Skeleton`) that mimics a typical admin page (header strip + stat row + table block).

In `AdminShell`, wrap `<Outlet />` in its own `<Suspense fallback={<AdminPageSkeleton />}>` so route-chunk loads paint a layout-matched skeleton inside the shell instead of the global progress bar.

### Step 2 — AnimatePresence page transitions
Replace the current `key={pathname} className="animate-page-enter"` div in `AdminShell <main>` with:

```tsx
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <Suspense fallback={<AdminPageSkeleton />}>
      <Outlet />
    </Suspense>
  </motion.div>
</AnimatePresence>
```

Result: smooth fade+slide on every admin route change, no hard cuts, skeleton paints if chunk isn't ready.

### Step 3 — Hover prefetch (route chunks + query data)
Create `src/lib/adminPrefetch.ts` exporting a single map keyed by admin path:

```ts
{
  '/admin':                  { chunk: () => import('@/pages/admin/AdminDashboard'),
                               data:  (qc) => qc.prefetchQuery({ queryKey: ['admin-stats'], ... }) },
  '/admin/orders':           { chunk: () => import('@/pages/admin/AdminOrders'),
                               data:  (qc) => qc.prefetchQuery({ queryKey: ['admin-orders'], ... }) },
  '/admin/products':         { chunk: () => import('@/pages/admin/AdminProducts'), data: ... },
  '/admin/customers':        { chunk: () => import('@/pages/admin/AdminCustomers'), data: ... },
  '/admin/ecommerce-customers': { ... },
  '/admin/courses':          { ... },
  '/admin/enrollments':      { ... },
  '/admin/messages':         { ... },
  '/admin/coupons':          { ... },
  '/admin/delivery-zones':   { ... },
  '/admin/incomplete-orders':{ ... },
  '/admin/recovery-analytics': { ... },
  '/admin/settings':         { ... },
  '/admin/analytics':        { ... },
}
```

Each `data` prefetcher reuses the **exact same `queryKey` + `queryFn`** the destination page already uses (read from each page/hook so caches hit on arrival). `staleTime` matches the page's existing setting (so prefetch isn't wasted).

In `AdminSidebar.tsx`, add to every `<NavLink>`:
```tsx
onMouseEnter={() => prefetchAdminRoute(item.url, queryClient)}
onFocus={()      => prefetchAdminRoute(item.url, queryClient)}
onTouchStart={() => prefetchAdminRoute(item.url, queryClient)}
```

Same handlers added to `AdminMobileNav.tsx` and the header's command palette items if present.

The helper de-dupes calls (Set of already-prefetched paths) so repeated hovers are free.

### Step 4 — Verification
- `tsc --noEmit` clean.
- Hover any sidebar link → Network tab shows the chunk + a Supabase request fire **before** click.
- Click → page paints from cache instantly; if not ready, skeleton shows for ~100ms then content fades in.
- Re-visit a previously-opened page → loads from query cache (no spinner), background revalidates after `staleTime`.
- No layout shift during fade (skeleton matches page chrome height).
- Mobile: touch-start prefetch keeps perceived latency near zero.

## Files

**New**
- `src/components/admin/AdminPageSkeleton.tsx`
- `src/lib/adminPrefetch.ts`

**Edited**
- `src/components/admin/AdminLayout.tsx` (Suspense + AnimatePresence in `AdminShell`)
- `src/components/admin/AdminSidebar.tsx` (hover/focus/touch prefetch on every NavLink)
- `src/components/admin/AdminMobileNav.tsx` (same prefetch handlers)

**Untouched**
- All 13 admin pages — their queries, mutations, Supabase calls, Zod schemas, and UI remain exactly as-is.
- `App.tsx` route table (already correctly lazy-loaded).
- `QueryClient` defaults (already stale-while-revalidate).

## Why this is the right scope
- Solves the actual perceived-latency root causes: blank Suspense fallback, hard route cut, cold query cache on first visit.
- Zero risk to business logic — purely additive (skeleton, motion wrapper, prefetch handlers).
- No new deps; `framer-motion` and `@tanstack/react-query` already installed.
- Composable with the per-page 9-pillar audits already in flight (each page's query keys feed straight into the prefetch map).

