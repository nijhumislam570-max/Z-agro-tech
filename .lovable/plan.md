

# Global Architecture Re-Audit — Z Agro Tech (Post-Fix Stable State)

This is a fresh read-only audit conducted after the P0/P1/P2/P3 batches landed. The previous audit identified blockers; this one verifies those fixes held and surfaces what remains before per-page work begins.

---

## Verification Of Previously Approved Fixes

| Concern | State | Evidence |
|---|---|---|
| `useUserRole` focus-refetch storm | ✅ Fixed | `refetchOnWindowFocus: false`, `staleTime: 30min`, no realtime channel |
| `useFocusManagement` 100ms timeout flash | ✅ Fixed | Now `requestIdleCallback`, skips when focus already inside `<main>`, skips first mount |
| Outer Suspense + duplicate progress bar | ✅ Fixed | Removed in `App.tsx`; only shell-level Suspense + `RouteProgress` remain |
| `AdminEcommerceCustomers` multi-MB hover prefetch | ✅ Fixed | Chunk-only warm in `adminPrefetch.ts` |
| Legacy color aliases (`coral/mint/sky/lavender/sunshine`) | ✅ Removed | Regex scan for any remaining `bg-coral`, `text-mint`, etc. → 0 hits |
| Dark mode tokens | ✅ Implemented | Forest/loam dark palette in `index.css`; `ThemeProvider` wired with `attribute="class"`, `defaultTheme="light"`, `storageKey="zagrotech-theme"` |
| Sonner toast theme | ✅ Hardcoded light | (verified previously) |
| `.glass`/`.bg-agri-gradient` utilities | ✅ Deleted | `index.css:587` confirms removal |
| `staleTime` constants centralized | 🟡 Partial | `App.tsx`, `adminPrefetch.ts`, `publicPrefetch.ts`, `useAdmin.ts` use them; **13 page hooks still inline literals** |

The foundation is genuinely stable. The remaining items are smaller and almost all fall into one of two patterns.

---

## 1. Layout & Design System

**Stable.** Persistent `PublicShell` and `AdminShell` are correct, semantic token family is complete, dark mode now lifts brand palette correctly, all legacy aliases purged.

### Issues remaining

**LOW — `peach`/`cream` aliases still exist in `tailwind.config.ts` (lines 59-60)** mapped to `--cream`. Zero usages in `.tsx` (verified). Safe to delete; non-blocking.

**LOW — `index.css` still defines `--forest*`, `--sage*`, `--harvest*`, `--soil`, `--cream` brand-specific tokens (lines 42-51).** None of them are exposed in `tailwind.config.ts`, so they're effectively dead unless used via raw `hsl(var(--forest))` somewhere. Worth a search-and-prune pass during page audits.

**LOW — Dark-mode parity for `--cream`, gradients, and shadows is missing.** `:root` defines `--gradient-hero`, `--gradient-primary`, `--shadow-card`, etc.; `.dark` does not redefine them. Result: dark mode uses light-mode shadow alphas (`0.08` over near-black bg → invisible) and the `--gradient-hero` (sage→cream→harvest pastels) over a dark page. Will look broken on any page using `.gradient-hero` or `shadow-card` in dark mode.

---

## 2. Routing & Guards

**Stable.** Redirects, persistent shells, lazy routes all confirmed.

### Issues remaining

**MEDIUM — `RequireAdmin` non-admin redirect race**
Lines 28-34: when `!isAdmin && !toastedRef.current`, fires a 1500ms `setTimeout(() => navigate('/'))`. The timeout callback does **not** re-check `isAdmin`. If a user with admin role lands during a brief loading-flicker, they'd see "Access Denied" then be redirected home anyway. The previous audit flagged this and it was not addressed. Low likelihood given the focus-refetch fix, but the bug is real.

**LOW — Dead `children` prop in `AdminShell`**
`AdminLayout.tsx:42`: `interface AdminShellProps { children?: ReactNode }` and `:148`: `{children ?? <Outlet />}`. Now that every admin route renders via `<Outlet />`, the `children` branch is never taken. Delete for clarity.

**LOW — `AdminLayout` compat shim still exported**
The shim (lines 58-61) exists for back-compat with old pages. Worth a search to confirm zero pages still call `<AdminLayout title=...>`; if so, both shim and `useAdminPageMeta` ergonomics can be simplified.

---

## 3. State & Data Layer (TanStack Query)

**Stable foundation.** Single QueryClient, sane defaults, prefetchers mirror destination keys.

### Issues remaining

**MEDIUM — `staleTime` literals scattered across 13 files**
Inventory (every place still using a raw number):

| File | Value | Could use |
|---|---|---|
| `useMyOrders.ts` | `60_000` | `STALE_1MIN` |
| `useEnrollments.ts` | `60_000` | `STALE_1MIN` |
| `useFeaturedAgri.ts` | `60_000` | `STALE_1MIN` |
| `useDashboardData.ts` (×2) | `60_000` | `STALE_1MIN` |
| `useCourseBatches.ts` | `30_000` | `STALE_30S` |
| `AdminCourses.tsx` | `30_000` | `STALE_30S` |
| `useProfile.ts` | `1000 * 60 * 5` | `STALE_5MIN` |
| `useDeliveryCharge.ts` | `1000 * 60 * 5` | `STALE_5MIN` |
| `AdminIncompleteOrders.tsx` | `1000 * 60 * 5` | `STALE_5MIN` |
| `useAdminAnalytics.ts` | `1000 * 60 * 2` | `STALE_2MIN` |
| `AdminEcommerceCustomers.tsx` (×3) | `1000 * 60 * 2` | `STALE_2MIN` |
| `ShopPage.tsx` (×2) | `5 * 60 * 1000`, `2 * 60 * 1000` | `STALE_5MIN`, `STALE_2MIN` |

Also: `useAdminProducts` and `useAdminOrders` in `useAdmin.ts` rely on the global default (2min) but the matching prefetcher in `adminPrefetch.ts` explicitly passes `STALE_2MIN`. Consistent today; will silently drift the moment someone changes one side.

**HIGH — Two page-level realtime channels duplicate work already done globally**
- `src/pages/ShopPage.tsx:305` — `shop-products-realtime` listens to `products` ALL events. The global `useAdminRealtimeDashboard` ALSO listens to `products` but only invalidates `admin-products`. **Verdict: ShopPage's channel is required** because the public site is not inside `useAdminRealtimeDashboard`'s scope. KEEP. (Should be debounced like the admin one — currently invalidates on every event.)
- `src/hooks/useProductCategories.ts:32` — `product-categories-realtime` listens to `product_categories`. `useAdminRealtimeDashboard` does NOT cover this table. **KEEP** — but again, no debounce.

So the global audit's earlier "delete duplicate channels" claim was correct for orders/incomplete_orders/delivery_zones/coupons (already fixed) but these two are legitimate. The remaining issue is they're both undebounced — a bulk admin product import will fire dozens of invalidations on the public Shop page in seconds.

**LOW — `useMyOrders` and `useEnrollments` are not invalidated when the dashboard's `dashboard-data` flow refetches.** Manual cross-key invalidation pattern; out of scope now, flag for the dashboard page audit.

---

## 4. Supabase

**Stable.** Single client, external-store auth, no provider tree, RLS gating uniform.

### Issues remaining

**MEDIUM — `AuthProvider` renders ungated assignment of `queryClientRef`**
`AuthContext.tsx:125`: `if (queryClient) queryClientRef = queryClient;` runs on every render of `<AuthProvider>`. Trivial cost (one variable assignment) but still dirty. Should be a one-time init in module scope or a useEffect with a ref guard.

**MEDIUM — `supabase.auth.onAuthStateChange` handler is at module load**
`AuthContext.tsx:41`. Fires once per token rotation — including silent refreshes during long sessions. Each fire calls `emitChange()` which re-renders every `useAuth()` consumer (`Navbar`, `MobileNav`, `RequireAuth`, every dashboard tile, etc.). Today this is acceptable because the snapshot is shallow-equal at the user-id level for most consumers, BUT `useAuth()` returns a new object every call (`{ user, session, loading, error, signUp, ... }`), so any consumer that destructures `session` will tear on every refresh. Worth a selector-based hook (`useAuthUser()`, `useAuthSession()`) for the dashboard audit.

**LOW — `decrement_stock` RPC remains unused** (already flagged previously; dead surface).

---

## 5. Performance Baseline

**Stable.** Lazy routes, manual chunk splits, idle-time admin chunk warming, error-boundary auto-reload all verified.

### Issues remaining

**HIGH — Three known heavy admin pages still unsplit** (carried from previous audit; these are the per-page audit targets):
- `AdminOrders.tsx` ≈ 1130 LOC
- `AdminProducts.tsx` ≈ 920 LOC
- `AdminEcommerceCustomers.tsx` — 3 sequential queries on mount, in-browser join

**MEDIUM — `RouteProgress` runs four `setTimeout`s on every navigation (lines 56-58)**
`80ms → 260ms → 600ms` for visual easing. Combined with `useFocusManagement`'s idle callback, this is fine on fast routes but creates 4 micro re-renders during the slowest part of a heavy page commit. Consider a single `requestAnimationFrame` driver.

**LOW — `<Sonner />` is mounted outside `<BrowserRouter>`** (App.tsx:88). Any toast that needs `useNavigate()` (e.g., admin realtime "View" actions) goes through the navigate function passed from inside the router subtree, which works — but means Sonner itself can't subscribe to route changes for auto-dismissal-on-navigate. Not a bug, but worth noting if route-aware toasts are needed.

---

## Patterns That Could Still Break Multiple Pages

1. **`useProfile`, `useDeliveryCharge`, `useDashboardData`, `useFeaturedAgri`, `useMyOrders`, `useEnrollments`, `useCourseBatches`** — every hook that hard-codes `staleTime` will silently disagree with prefetchers if anyone updates one side. Migrating to `queryConstants.ts` is one edit per hook.
2. **`useAuth()` return object identity** — anything that destructures the full hook return will re-render on token refresh. Currently mostly tolerable; will become noticeable when more dashboard tiles read auth.
3. **Public realtime channels (`shop-products-realtime`, `product-categories-realtime`)** — undebounced, will thrash if admin does bulk edits while a customer is shopping.
4. **Dark-mode gradients + shadows** — pages that use `.gradient-hero` or `shadow-card` will look broken in dark mode until `.dark` token block is extended.

---

## Prioritized Fix Order Before Page-Level Audits

| Priority | Item | Files | Why |
|---|---|---|---|
| **P1** | Migrate 13 hooks/pages to `queryConstants.ts` | The 13-row table above | Eliminates staleTime drift across the codebase |
| **P1** | Add debounce to `shop-products-realtime` and `product-categories-realtime` (mirror the `invalidateDebounced` helper from `useAdminRealtimeDashboard`) | `ShopPage.tsx`, `useProductCategories.ts` | Prevents public-site thrash on admin bulk edits |
| **P1** | Extend `.dark` token block with gradient + shadow overrides | `src/index.css` | Dark mode renders correctly across hero/card surfaces |
| **P2** | Fix `RequireAdmin` non-admin redirect to re-check `isAdmin` inside the timeout callback | `RequireAdmin.tsx` | Prevents flash-redirect race |
| **P2** | Delete `children` prop and `AdminLayout` shim from `AdminLayout.tsx` (after confirming no consumers) | `AdminLayout.tsx` | Dead surface |
| **P2** | Move `queryClientRef` assignment in `AuthProvider` to module-load + add selector hooks `useAuthUser()` / `useAuthSession()` | `AuthContext.tsx` | Stops per-render side effect; prepares for dashboard audit |
| **P3** | Remove `peach`/`cream` Tailwind aliases + unused `--forest*/--sage*/--harvest*/--soil/--cream` CSS vars (after grep) | `tailwind.config.ts`, `src/index.css` | Final design-system cleanup |
| **P3** | Collapse `RouteProgress` setTimeouts into one rAF driver | `RouteProgress.tsx` | Micro |

The three P1 items collectively take ~30 minutes and are the only things that could surface as bugs during the per-page audits. Everything below P1 is housekeeping that won't change behaviour.

---

## Clarifying Questions

Only one decision is needed before executing:

1. **`useProfile` staleTime is 5min, but `AuthContext` re-emits on every token refresh** — when we add selector hooks (`useAuthUser`/`useAuthSession`), do you want me to also memoize the returned action functions (`signIn`/`signUp`/`signOut`) at module scope so they're truly stable across renders? It's a tiny change but it eliminates one more "why did this re-render?" mystery during page audits.

If yes to (1), I'll execute P1 + P2 in one pass and then start the per-page audits on a stable foundation. If you want only the P1 batch, say "P1 only" and I'll skip the auth refactor.

