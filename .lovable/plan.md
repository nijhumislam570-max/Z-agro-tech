

# Non-Admin Navigation Speed — Audit & Fix Plan

## Audit (most of the spec is already done)

| Spec step | Status | Notes |
|---|---|---|
| 2 Lazy load all routes | ✅ Done | All 17 non-admin pages already `lazy()` in `App.tsx` |
| 3 Suspense fallback | ✅ Done | `PageLoader` top progress bar (no white flash) |
| 5 Caching | ✅ Done | `staleTime: 2min`, `gcTime: 10min`, `refetchOnWindowFocus: false` |
| 6 Page transitions | ✅ Done | Global 180ms `animate-page-enter` keyed on pathname |
| 7 Prefetch likely next pages | ✅ Done | `usePrefetch` wired into Navbar, Footer, MobileNav |
| 8 Image optimization | ✅ Done | `OptimizedImage` + Supabase transform params |
| 9 Skeletons | ✅ Done | `ProductCardSkeleton`, `CourseSkeleton`, etc. |

## Real bottlenecks found

1. **No persistent layout shell** — every public page renders its own `<Navbar />` + `<Footer />` (+ optional `<MobileNav />`). On route change, both remount from scratch, which:
   - Re-runs `useUserRole` query check (cached, but the React component lifecycle still re-evaluates)
   - Re-derives the cart badge / active-link calculations
   - Causes a sub-perceptible "logo flash" on slower devices
   - Reproduces exactly the same problem we just solved for `/admin`

2. **Prefetch map is incomplete for parametric routes** — `routePrefetchMap` keys `/product` and `/course` but a hover on `/product/abc123` correctly resolves; however `/cart` and `/checkout` are missing **prefetch on hover** in `MobileNav` because `prefetchRoute('/cart')` works but the Navbar's cart icon (`CartQuickPeek` trigger) never calls it. Minor.

3. **`Navbar` calls `usePrefetch` 5 times unconditionally** at the top level — fine, just inefficient code shape; not a perf hit.

4. **`ScrollToTop` runs `useFocusManagement()` on every route change** — already lightweight, no fix needed.

5. **`/dashboard` and `/track-order`** — already optimized in prior sprints.

## Plan — Single focused fix (the only real win)

### Fix A — Persistent Public Layout Shell *(parallels the `/admin` fix)*

Create a `<PublicShell />` that mounts `<Navbar />` + `<Footer />` + (optional) `<MobileNav />` **once**, with an `<Outlet />` between them. Restructure `App.tsx` to nest all public routes under it. Each page then exports just its `<main>` content and stops rendering its own Navbar/Footer/MobileNav.

```text
Before                          After
<Index>                         <Route element={<PublicShell/>}>
  <Navbar/>                       <Route path="/" element={<Index/>}/>
  <main>...</main>                <Route path="/shop" element={<ShopPage/>}/>
  <Footer/>                       ...
</Index>                        </Route>
```

**Result**: Navbar/Footer/MobileNav stay mounted across `/` → `/shop` → `/product/:id` → `/cart` → `/checkout`. No more remount flash, no re-evaluation of nav-internal state, instant perceived navigation.

The shell needs **two variants** based on the route:
- `<PublicShell />` — Navbar + Footer (default)
- `<PublicShellWithMobileNav />` — Navbar + content + MobileNav (for shop/cart/track-order/contact where mobile bottom nav is shown)

Or simpler: one shell that **always** renders MobileNav (it's already `md:hidden`-gated and adds zero desktop cost) — that's actually the cleaner choice and is what most apps do. Confirm: every page currently *with* MobileNav already has `pb-20 md:pb-0` body padding; pages *without* (Index, Academy, About, FAQ, Privacy, Terms, Auth) don't have that padding but also don't currently show MobileNav. **Solution**: shell always renders MobileNav; we add `pb-20 md:pb-0` to the shell's wrapper div, neutral on desktop.

### Fix B — Tiny prefetch polish *(1 file)*

Add `usePrefetch('/cart')` + `usePrefetch('/checkout')` handlers to the cart icon button in `Navbar.tsx` so hovering the cart starts loading those chunks before the user clicks through.

## Out of scope (already good)

- Image optimization — already covered by `OptimizedImage` + Supabase transforms
- Splitting heavy pages (`ShopPage`) — `useMemo` + `memo` already applied; not the bottleneck
- Charts — non-admin doesn't render any
- Adding new motion library — keep the 180ms CSS keyframe

## Files Touched (~20 small edits)

| File | Change |
|---|---|
| `src/components/PublicShell.tsx` | **NEW** — Navbar + `<Outlet/>` + Footer + MobileNav |
| `src/App.tsx` | Wrap all non-admin routes (except `/auth`, `/forgot-password`, `/reset-password` which are full-bleed) under `<PublicShell/>` |
| `src/components/Navbar.tsx` | Add `usePrefetch('/cart')` to cart icon |
| `src/pages/Index.tsx` | Remove inline `<Navbar/>` + `<Footer/>` |
| `src/pages/ShopPage.tsx` | Remove inline `<Navbar/>` + `<Footer/>` + `<MobileNav/>` |
| `src/pages/ProductDetailPage.tsx` | Remove shell |
| `src/pages/AcademyPage.tsx` | Remove shell |
| `src/pages/CourseDetailPage.tsx` | Remove shell |
| `src/pages/CartPage.tsx` | Remove shell |
| `src/pages/CheckoutPage.tsx` | Remove shell |
| `src/pages/TrackOrderPage.tsx` | Remove shell (keep two render branches) |
| `src/pages/DashboardPage.tsx` | Remove shell |
| `src/pages/AboutPage.tsx` | Remove shell |
| `src/pages/ContactPage.tsx` | Remove shell |
| `src/pages/FAQPage.tsx` | Remove shell |
| `src/pages/PrivacyPolicyPage.tsx` | Remove shell |
| `src/pages/TermsPage.tsx` | Remove shell |
| `src/pages/NotFound.tsx` | Remove shell |

**Auth pages stay standalone** — `/auth`, `/forgot-password`, `/reset-password` already use a different full-bleed branded layout with no Navbar; they remain outside `PublicShell`.

## Decision

Reply with one of:
- **"Execute the full plan"** — recommended, ~18 files, real perceived-speed win.
- **"Just do Fix B (cart prefetch)"** — 1 file, tiny.
- **"Skip — current speed is good enough"** — no changes; non-admin is already well-optimized aside from the remount.

