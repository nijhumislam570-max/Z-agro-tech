

# Phase 8 — SEO & Accessibility Plan

After auditing meta tags, semantics, schemas, and a11y primitives, the app is **already in strong shape**: every public page (Index, Shop, Academy, About, FAQ, Privacy, Terms, Contact, ProductDetail, CourseDetail) has `<SEO>` with unique titles + descriptions, the sitemap edge function is live, JSON-LD is wired for Organization (home), Product (PDP), and Course (CDP), `<main id="main-content">` + skip link + focus management are global, and the global CSS already enforces 44px touch targets. The remaining gaps are narrow.

## Findings (priority-ordered)

### HIGH — real gaps
- **S1 — `NotFound` (404) has no `<SEO>` and no `noIndex`.** Search engines may index 404 pages, and the page lacks a meta description. Fix: add `<SEO title="Page Not Found" noIndex description="…" />` + wrap content in `<main>`.
- **S2 — `AuthPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `TrackOrderPage`, `CartPage`, `CheckoutPage`, `Dashboard`, `NotFound` lack `<SEO>` tags.** They use `useDocumentTitle` only — no meta description, no OG tags, no `noIndex` on auth/cart/checkout (which `robots.txt` blocks but the meta would reinforce). Fix: add minimal `<SEO>` tags. Auth/cart/checkout/dashboard get `noIndex`; track-order gets a public meta description.
- **S3 — Shop page schema is mislabelled as `Organization` instead of `CollectionPage` / `ItemList`.** Currently:
  ```ts
  schema={{ type: 'Organization', name: 'Z Agro Tech Shop', ... }}
  ```
  An Organization schema on `/shop` competes with the canonical Organization schema on `/`. Fix: extend `SEO.tsx` with an `ItemList` schema type, wire it on `/shop` (top 10 visible products) and `/academy` (top 10 courses) — proper storefront/academy structured data.
- **S4 — No `BreadcrumbList` schema anywhere despite the `SEO` component supporting it.** Product detail and course detail show visual breadcrumbs ("Shop / Product Name") but no JSON-LD. Fix: wire `BreadcrumbList` schema on `ProductDetailPage` and `CourseDetailPage` (Home → Shop/Academy → Item).

### MEDIUM — semantics & a11y polish
- **A1 — `Index.tsx` value-props block uses `<section>` without `aria-labelledby` or a heading.** The 3 cards (Premium quality / Verified experts / Fast delivery) have `<h3>`s but no section-level heading. Fix: add an `sr-only` `<h2>` ("Why choose Z Agro Tech") and `aria-labelledby` on the section.
- **A2 — `NotFound` page has no `<main>` landmark, no `<Navbar>`/`<Footer>`, and the back link is a plain `<a href>` (full reload).** Fix: convert to `<Link>`, wrap in `<main>`, add Navbar/Footer for consistency.
- **A3 — `Footer` social links use `href="#"` placeholders.** Screen readers announce them as functional links to the same page. Fix: either remove the `<a>` wrapper for placeholders or add real URLs. Lower priority — keep placeholders but add `aria-disabled="true"` + `tabIndex={-1}` if no real URL is available.
- **A4 — `ShopPage` HeroCarousel `<button>`s for prev/next don't expose `aria-label`** (spot-checked at lines ~400+). Will verify and add.

### LOW — already correct, no action
- Global 44px min touch target enforced in `index.css` ✓
- Skip link + `useFocusManagement` (focuses `<main>` on route change, announces title via live region) ✓
- All public pages use `<main id="main-content">` ✓
- Sitemap edge function returns `text/xml` with products + courses + static pages ✓
- `robots.txt` blocks `/admin`, `/dashboard`, `/checkout`, `/cart` for non-major bots ✓
- Canonical URLs set on Index, Shop, Academy, About, Contact, FAQ, Privacy, Terms ✓
- Every page has exactly one `<h1>` (visible or sr-only) — Sprint 5 baseline enforced ✓
- Focus states: shadcn defaults (`focus-visible:ring-2 ring-ring`) consistent everywhere ✓
- `<Form>` controls all use shadcn `<Label htmlFor>` pairing ✓

## Execution scope (~7 files, no new deps, no DB changes)

```
src/components/SEO.tsx                  (extend with ItemList schema type)
src/pages/Index.tsx                     (A1 — aria-labelledby on value-props section)
src/pages/ShopPage.tsx                  (S3 — replace Org schema with ItemList of featured products + verify carousel button labels)
src/pages/AcademyPage.tsx               (S3 — add ItemList schema + canonicalUrl)
src/pages/ProductDetailPage.tsx         (S4 — add BreadcrumbList schema alongside Product schema)
src/pages/CourseDetailPage.tsx          (S4 — add BreadcrumbList schema alongside Course schema)
src/pages/NotFound.tsx                  (S1, A2 — SEO noIndex + main landmark + Navbar/Footer + Link)
src/pages/AuthPage.tsx                  (S2 — SEO noIndex)
src/pages/ForgotPasswordPage.tsx        (S2 — SEO noIndex)
src/pages/ResetPasswordPage.tsx         (S2 — SEO noIndex)
src/pages/TrackOrderPage.tsx            (S2 — SEO public meta + canonicalUrl)
src/pages/CartPage.tsx                  (S2 — SEO noIndex)
src/pages/CheckoutPage.tsx              (S2 — SEO noIndex)
src/pages/DashboardPage.tsx             (S2 — SEO noIndex)
```

## Out of scope (intentionally)
- **No `react-helmet-async`** — the existing `SEO.tsx` direct-DOM approach works and avoids a new dep.
- **No sitemap rewrite** — current edge function is correct and fresh.
- **No accessibility framework swap** (e.g. axe-core CI) — flag for future infra sprint.
- **No FAQPage schema** despite supporting `FAQPage` JSON-LD — content lives in static array; would need typed FAQ schema variant. Defer.
- **No language alternates / hreflang** — Bengali content not yet in product copy; revisit when localization lands.

## Decision

Reply with one of:
- **"Execute all of Phase 8"** — full ~14 files, recommended.
- **"Execute S1–S4 only"** — SEO gaps + structured data, skip A1–A2 polish. ~10 files.
- **"Skip noIndex on private pages"** — `robots.txt` already covers them; only do public-page schema work.

