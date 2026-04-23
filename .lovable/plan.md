# Global Architecture Audit — Z Agro Tech

Read-only review of shared layers (layout, routing, state, data, Supabase, performance). Findings are grouped by severity. Anything tagged **BLOCKER** must be addressed before page-level work.

---

## 1. Layout & Design System

### What's good

- `PublicShell` and `AdminShell` are correctly persistent (mounted once, swap content via `<Outlet />`). Pathname-keyed wrapper applies `animate-page-enter` to inner content only — no shell remount.
- Tailwind config exposes a complete semantic token family (`success/warning/info/danger/accent/neutral` with `-light/-soft/-border/-foreground` variants).
- Brand color tokens (`primary`/`accent`/`secondary`) drive all surfaces; raw palette colors (`bg-green-500`, etc.) do not appear in the codebase — confirmed by regex scan returning **0 hits**.
- 44px global touch target rule is enforced in `index.css` `@layer base`.

### Issues

**HIGH — Legacy alias debt in `index.css**`
The token system carries 9 dead aliases from the Vetmedix era: `--coral`, `--coral-light`, `--coral-dark`, `--mint`, `--mint-light`, `--sky`, `--sky-light`, `--lavender`, `--lavender-light`, `--sunshine`, `--sunshine-light`, `--peach`. They're remapped to forest/sage values, so any component still using `bg-coral` silently renders as primary green. This will mask token-related bugs during page audits. Memory `mem://style/branding-standard` even still describes "coral/peach primary CTA" — stale.

**HIGH — Dark mode token mismatch**
`:root` defines an earthy forest green theme; `.dark` redefines `--primary` to `15 80% 58%` (orange) and `--accent` to teal. There is no theme switcher in the app, but the dark variables are stale and would render an entirely different brand if `.dark` were ever applied (e.g., via system preference + a future class toggle). Either commit to dark mode or delete the block.

**MEDIUM — `.glass` / `.bg-agri-gradient` utilities still defined**
`@layer utilities` in `index.css` keeps `.glass`, `.glass-strong`, `.bg-agri-gradient`. The recent Dashboard refactor explicitly retired these. Leaving them risks reintroduction. Flag for cleanup.

**MEDIUM — Two h-1 progress bars co-exist**
`PageLoader` (App.tsx) renders `animate-progress-bar` as the Suspense fallback. `RouteProgress` renders a separate gradient bar driven imperatively. On a cold lazy chunk load both can paint, producing visual jitter at the top edge. Pick one; the imperative `RouteProgress` wins on UX.

**LOW — `forwardRef` on `MobileNav` is unused**
`<MobileNav />` is rendered without a `ref` from `PublicShell`. Harmless, but indicates dead API surface.

---

## 2. Routing & Guards

### What's good

- `BrowserRouter` matches Lovable SPA fallback hosting.
- Persistent shells (`PublicShell`, `AdminShell`) eliminate Navbar/Footer/Sidebar remount on every navigation.
- `/profile → /dashboard` redirect works via `<Navigate replace>`.
- `RequireAdmin` uses both `useAuth` and `useUserRole` and shows a real Access Denied screen, not a blank flash.

### Issues

**BLOCKER — `RequireAuth` and `RequireAdmin` re-render every nav inside their subtree**
`RequireAuth` reads the entire `useAuth()` snapshot, so any auth state change re-renders the guard and unmounts/remounts its child route element. Same pattern in `RequireAdmin` via `useAdmin` + `useUserRole`. This is fine on initial mount, but `useUserRole` invalidates on `refetchOnWindowFocus: true` (line 50), so **switching tabs and returning silently re-runs the role query and momentarily re-renders the entire admin tree**. Suspect this is part of what's still making heavy admin pages "feel" slow on tab-switch.

**HIGH — `useFocusManagement` runs `setTimeout(..., 100)` on every route change**
Triggered from `<ScrollToTop />` in `App.tsx`. It also blurs and re-focuses `#main-content`, which on heavy pages causes a visible focus-ring flash + an extra reflow exactly at the moment React Router commits the new page. This is likely a contributor to the post-click pause on `/admin/orders` and `/admin/products`.

**HIGH — `RequireAdmin` redirect on non-admin uses `setTimeout(..., 1500)` to navigate home**
A non-admin user visiting `/admin` sees the Access Denied card for 1.5s before redirect. This is intentional UX, but it also means failed prefetches/race conditions during role-loading states will show a flash of "Access Denied" before role resolves — confirmed by the structure (no `roleLoading` re-check after the toast fires). Should re-check `isAdmin` in the timeout callback.

**MEDIUM — Two layers of Suspense fallback**

- App.tsx `<Suspense fallback={<PageLoader />}>` wraps the entire `<Routes>`.
- `PublicShell` and `AdminShell` each have their own inner `<Suspense fallback={<PublicPageSkeleton />}>` / `<AdminPageSkeleton />`.
The outer fallback fires only on first auth/admin chunk load; the inner fallback is what users normally see. The outer one is dead code 95% of the time and contributes the second progress-bar issue above.

**LOW — `*` (NotFound) is nested inside `PublicShell**`
Correct visually, but means the public Suspense + PublicShell mount even for unknown URLs. Acceptable.

---

## 3. State & Data Layer (TanStack Query)

### What's good

- Single `QueryClient` at app root with sensible defaults: `retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 2min`, `gcTime: 10min`.
- `prefetchPublicRoute` + `prefetchAdminRoute` mirror destination query keys exactly, so hover-prefetched data hits the cache on arrival.
- `warmAllAdminChunks()` uses `requestIdleCallback` to avoid blocking the dashboard.

### Issues

**BLOCKER — `useUserRole` overrides the global `refetchOnWindowFocus: false**`
`src/hooks/useUserRole.ts:50` sets `refetchOnWindowFocus: true` and `staleTime: 1000 * 30` (30s). This single hook is consumed by `useAdmin`, which is consumed by `RequireAdmin`, `AdminShell`, `useAdminRealtimeDashboard`, `Navbar`, `MobileNav`, every admin hook, and every admin page. **Every tab switch by an admin → role refetch → cache key invalidation → cascading re-renders across the admin tree.** This is almost certainly the biggest remaining speed regression.

**HIGH — `prefetchAdminRoute` and page hooks key-collide on default pagination**
`adminPrefetch.ts` warms `['admin-orders', 0, 50]`. `useAdminOrders(page, pageSize)` defaults to `(0, 50)` — fine. But `useAdminUsers` defaults to `(0, 50)` and is **not prefetched at all** for `/admin/customers`. Inconsistent: some pages get warm cache, others cold. List below for fix order.

**HIGH — Duplicate realtime channels for the same tables**

- `admin-rt-orders` (in `useAdminRealtimeDashboard`) listens to `orders` UPDATE.
- `incomplete-orders-realtime` (in `useIncompleteOrders`) listens to `incomplete_orders`.
- `delivery-zones-realtime` (in `AdminDeliveryZones`) listens to `delivery_zones`.
- `admin-analytics-realtime` listens to `orders` again.
- `admin-rt-orders` ALSO listens to `incomplete_orders` and `delivery_zones`.

Result: each admin page pays for redundant Supabase Realtime subscriptions. The page-level channels should be **deleted** now that `AdminShell` runs `useAdminRealtimeDashboard` once globally.

**HIGH — `AdminEcommerceCustomers` pulls 2000 orders + ALL profiles + ALL user_roles into the browser**
`adminPrefetch.ts:101-141`. Even with `staleTime: 2min`, every cold prefetch ships a multi-MB payload before the user has clicked. This blocks the network tab and competes with the actual destination chunk. Already flagged in the prior plan; flagging again as a global pattern: **prefetch payloads must stay under ~50KB**.

**MEDIUM — Mix of `'staleTime: 60_000'`, `1000 * 60 * 2`, `STALE_2MIN`, etc.**
No central constants. Causes drift between page hooks and prefetchers (e.g., `'/dashboard'` prefetch uses `STALE_1MIN` but `useMyOrders`/`useEnrollments` use their own values). Fine functionally — staleTime just gates refetches — but creates "why did this refetch?" mysteries.

**LOW — `useUserRole` shows a `toast.info('Your permissions have been updated')` on every realtime role event, even on initial subscribe in some Supabase versions.** Should debounce or guard against the first event.

---

## 4. Supabase

### What's good

- Single client init in `src/integrations/supabase/client.ts` with `localStorage` persistence + `autoRefreshToken: true`.
- `AuthContext` uses an external store + `useSyncExternalStore` so auth changes don't re-render every consumer.
- `WishlistContext` and `CartContext` follow the same pattern — **no React Context provider tree**.
- RLS-protected admin queries are correctly gated by `enabled: isAdmin` everywhere.
- `enforce_single_admin` DB trigger matches the documented `mem://constraints/single-admin-policy`.

### Issues

**HIGH — `AuthProvider` is a no-op but still nested inside `<QueryClientProvider>**`
The provider in `App.tsx` only wires the queryClient ref via a side effect during render — it does NOT subscribe to children. That's fine, but the `queryClientRef = queryClient` assignment runs on **every render of App** because there's no useEffect guard. Also: `state = { ...state }` is mutated directly from a module-level `supabase.auth.onAuthStateChange` handler, which fires on every tab focus when the session token rotates. Each fire re-emits to all `useSyncExternalStore` subscribers app-wide.

**HIGH — Realtime channels are scoped per-user (`user-role-sync-${user.id}`) and cleaned up in useEffect**
Fine in isolation, but combined with the `RequireAdmin` re-render on role refetch, these channels can briefly be torn down + re-subscribed on a focus event. Supabase Realtime resubscribe is cheap but not free; a few seconds of duplicate channels is observable in the network panel.

**MEDIUM — `decrement_stock` RPC is unused now that `create_order_with_stock` does locking + decrement atomically.** Dead surface.

**LOW — No centralized typed wrapper around `supabase.from(...).select(...)**`. Each page reconstructs its select string, leading to over-fetching (e.g., `AdminOrders` selects every column even when the table only renders 8). Not blocking, but a refactor opportunity.

---

## 5. Performance Baseline

### What's good

- All 35+ routes are lazy-loaded via `React.lazy`.
- Manual chunk splitting in `vite.config.ts` separates vendor-react, vendor-supabase, vendor-charts, vendor-zod, vendor-date.
- `warmAllAdminChunks()` warms every admin page chunk during browser idle, so cold chunk parse is rarely the bottleneck post-mount.
- ErrorBoundary auto-reloads on chunk-load failure (stale-deploy resilience).
- `card-contain { contain: layout style paint }` available for heavy lists.

### Issues

**BLOCKER — `useFocusManagement` + `ScrollToTop` + `RouteProgress` + page-enter animation all fire on every navigation, in this order, on the same tick**

1. `useLocation()` change in `ScrollToTop` → `requestAnimationFrame` scroll.
2. `useFocusManagement` → `setTimeout(100)` → `mainContent.focus()` + screen-reader announce + DOM mutation (creates `#sr-announcer` if missing).
3. `RouteProgress` → state setters → second paint.
4. `<div key={pathname} className="animate-page-enter">` → 150ms CSS animation on the new page tree.

That's **4 separate render-cycle disturbances** on every route change. On a heavy page like `/admin/orders` (1130 LOC), each one extends time-to-interactive. **This is the next big speed win after fixing `useUserRole`.**

**HIGH — Heavy page chunks unsplit**

- `AdminOrders.tsx` ≈ 1130 lines (already flagged).
- `AdminProducts.tsx` ≈ 920 lines.
- `AdminEcommerceCustomers.tsx` does in-browser aggregation over 2000 rows × 3 joins.

These three are the only routes where users still report a perceptible pause. All other admin pages are fast post-prefetch.

**MEDIUM — Sonner Toaster uses `next-themes` but the project has no `ThemeProvider**`
`src/components/ui/sonner.tsx:7` — `useTheme()` returns `system` always; Sonner then reads OS preference. If the OS is dark, toasts render with dark styling against the always-light app, producing low contrast. Either remove `next-themes` or hardcode `theme="light"`.

**LOW — `OptimizedImage` and `prefetchRoute` (image preload) duplicate browser hints**. Not measurable.

---

## Patterns That Will Break Across Multiple Pages

1. **Any page that calls `useAdmin()` or `useUserRole()**` inherits the `refetchOnWindowFocus: true` regression.
2. **Any page that mounts its own `supabase.channel(...)**` for `orders/products/profiles/coupons/contact_messages/courses/enrollments/incomplete_orders/delivery_zones` is doubling work already done by `useAdminRealtimeDashboard`.
3. **Any page wrapped in `RequireAuth` or `RequireAdmin**` pays for `useFocusManagement`'s 100ms timeout + focus shift on every navigation.
4. **Any admin chart/table page** will inherit re-render storms when `AdminEcommerceCustomers` payload arrives (3 huge queries in flight at once).

---

## Prioritized Fix Order (BEFORE page-level optimization)


| Priority | Item                                                                                                                                                                       | Why first                                                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **P0**   | Set `useUserRole` `refetchOnWindowFocus: false`; raise `staleTime` to 5min                                                                                                 | Eliminates global re-render storm on tab focus           |
| **P0**   | Delete page-level realtime channels superseded by `useAdminRealtimeDashboard` (`useIncompleteOrders`, `AdminDeliveryZones`, `useAdminAnalytics`, `ShopPage` if duplicated) | Removes redundant network + handler work                 |
| **P0**   | Replace `useFocusManagement` 100ms timeout with `requestIdleCallback` and skip the focus shift if `document.activeElement` is already inside `<main>`                      | Removes the post-click flash                             |
| **P1**   | Remove the outer `<Suspense fallback={<PageLoader />}>` in App.tsx (rely on shell-level fallbacks + `RouteProgress`)                                                       | One fewer fallback to manage                             |
| **P1**   | Trim `AdminEcommerceCustomers` prefetch — drop the 2000-order payload from hover prefetch, only warm the chunk                                                             | Stops blocking the network on hover                      |
| **P1**   | Remove dead Coral/Mint/Sky/Lavender/Sunshine/Peach aliases from `index.css` and the `colors.coral/mint/sky/lavender/sunshine/peach` blocks in `tailwind.config.ts`         | Prevents stealth use of legacy tokens during page audits |
| **P2**   | Hardcode `theme="light"` in Sonner; remove `next-themes` import                                                                                                            | Toast contrast                                           |
| **P2**   | Delete `.glass`, `.glass-strong`, `.bg-agri-gradient*` utilities from `index.css`                                                                                          | Stop reintroduction of retired styles                    |
| **P2**   | Extract staleTime constants to `src/lib/queryConstants.ts`                                                                                                                 | Single source of truth                                   |
| **P3**   | Refactor `RequireAuth` / `RequireAdmin` to subscribe only to the `user` and `isAdmin` slices via custom selectors (currently they pull entire snapshots)                   | Marginal re-render reduction                             |


---

## Clarifying Questions Before We Execute

The audit raises three decisions only you can make:

1. **Dark mode** — Is dark mode planned for Z Agro Tech, or should I delete the `.dark` token block from `index.css`?
2. **Legacy color aliases** — Safe to remove `coral/mint/sky/lavender/sunshine/peach` token aliases entirely? (I scanned and found zero raw `bg-green-500` style usage, but I haven't yet verified no component still uses `bg-coral` / `text-mint`. I'll verify before deleting if you say "yes".)
3. `**useUserRole` realtime + focus refetch** — Do you actually need permissions to refresh when an admin returns to the tab? If the only admin is `nijhumislam570@gmail.com` and the role is enforced by DB trigger, the answer is "no" and we can drop both `refetchOnWindowFocus` and the realtime channel entirely (massive simplification).

Once you answer, I'll execute the P0 + P1 batch in one pass. Page-level audits start cleanly afterward, on a stable foundation. here is the ans: 1. implement darkmode properly. 2.  verify before deleting 3. NO. we can drop both `refetchOnWindowFocus` and the realtime channel entirely (massive simplification).