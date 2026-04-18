---
name: Sprint 5 Performance & A11y Baseline
description: Sprint 5 audit results — image lazy-loading, ARIA landmarks, focus management, skip link, reduced motion, H1-per-page enforcement
type: technical
---

# Sprint 5 — Performance & A11y Baseline (Z Agro Tech)

## Active foundations (verified)
- **Skip link**: `Navbar` renders an sr-only "Skip to main content" anchor that reveals on focus and targets `#main-content`.
- **Focus management**: `useFocusManagement` (mounted in App ScrollToTop) focuses `<main>` on every route change and announces the new page title via an ARIA live region.
- **Lazy routes**: All public + admin pages are `lazy()` imported with a `Suspense` fallback (`PageLoader` shows a top progress bar).
- **Image optimization**: `OptimizedImage` (Intersection Observer + Supabase storage transforms) is the canonical image primitive. `imageUtils.getOptimizedUrl` applies width/quality presets.
- **Route prefetch**: `usePrefetch` warms route chunks on hover/touch via `prefetchRoute`.
- **Reduced motion**: `index.css` has `@media (prefers-reduced-motion: reduce)` rules.
- **Service worker**: Network-first for navigation, cache-first only for images/fonts. Never caches JS/CSS to avoid stale bundles.
- **Web Vitals**: `initWebVitals()` runs in `main.tsx`.

## Sprint 5 fixes applied
- `DashboardPage`: added an `sr-only` H1 ("Your Z Agro Tech Dashboard") so the page has a real top-level heading (was starting at H2).
- `ProductDetailPage`: thumbnail nav `<img alt="">` replaced with descriptive `${product.name} — thumbnail ${idx + 1}`.
- `LowStockAlert`: button now has `aria-label`, `aria-expanded`, `min-h-[44px]`, and a focus ring.

## H1 coverage by page (must remain ≥1 visible-or-sr-only H1 per route)
- `/` Index → `HeroSection` H1 ✅
- `/dashboard` → sr-only H1 ✅
- `/admin/*` → `AdminHeader` H1 (renders `title` prop) ✅
- All other routes already verified to have an H1.

## Outstanding (not addressed this sprint)
- A handful of components still use hardcoded color classes (e.g. `bg-green-100`, `text-green-700`) instead of semantic tokens — flagged by lint, leave for a focused theming sprint.
- Lighthouse needs to be run against the published URL once the project is deployed.

## Rule
Every new page MUST contain exactly one `<h1>` (visible or `sr-only`) and a `<main id="main-content">` landmark, otherwise focus management + screen-reader navigation breaks.
