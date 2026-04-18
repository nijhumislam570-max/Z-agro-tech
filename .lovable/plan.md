

# Customer-Facing Frontend Audit — Z Agro Tech

I crawled the customer-facing layer (public + auth-gated routes, `/admin` excluded per Lock-Files rule) and traced every journey end-to-end. Below is the diagnostic report and a phased execution roadmap. **No code changes yet.**

---

## 1. Architecture map (relevant slice)

**Routes** (App.tsx) — Public: `/`, `/auth`, `/forgot-password`, `/reset-password`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`, `/shop`, `/product/:id`, `/track-order`, `/academy`, `/course/:id`. Auth-gated (`RequireAuth`): `/cart`, `/checkout`, `/dashboard`. Admin-gated (`RequireAdmin`): all `/admin/*`.

**State stores** — `useSyncExternalStore` singletons: `AuthContext`, `CartContext` (key `zagrotech-cart` + legacy migration), `WishlistContext` (auth-bound, optimistic).

**Data hooks** — `useMyOrders`, `useMyEnrollments`, `useIsEnrolled`, `useCourses`, `useCourse`, `useCourseBatches`, `useDeliveryCharge`, `useCheckoutTracking`, `useDashboardKPIs`, `useRecommendedProducts`, `useFeaturedMasterclass`, `useFeaturedAgri`, `useProductCategories`, `useProductRatings`, `useRecentlyViewed`.

**Edge fns** — `geocode`, `steadfast` (auth + rate-limited), `parse-product-pdf`, `upload-image-url`, `sitemap`, `delete-user`.

**RLS** — orders/enrollments/wishlists/incomplete_orders all `auth.uid() = user_id`. Order creation goes through `create_order_with_stock` RPC (atomic stock check + lock). ✅ Safe.

---

## 2. Diagnostic findings

### 🔴 HIGH priority — broken or unsafe

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | **Broken routes** — dashboard tiles link to `/academy/${id}` and `/shop/${id}` but actual routes are `/course/:id` and `/product/:id`. Users land on `AcademyPage`/`ShopPage` (no detail). | `LearningPathTile.tsx:77`, `MasterclassTile.tsx:74`, `FeaturedCarouselTile.tsx:39,72`, `RecommendedInputsTile.tsx:38,47` | Continue-Learning + Featured-Masterclass + Recommended-Inputs CTAs all silently misroute. |
| H2 | **Cart item shape mismatch** — home `FeaturedProductsGrid` → `shop/ProductCard.tsx` calls `addItem({ ...image_url, ...} as any)` but `CartItem` expects `image`. Items added from the homepage have `image: undefined`, so the cart drawer + cart page show a broken thumbnail. | `src/components/shop/ProductCard.tsx:32` | Visible UX bug for the very first cart-add path most users hit. |
| H3 | **`useCheckoutTracking` writes incomplete order even after rejected/empty form** — `useEffect` deps array uses `items.length` only and `eslint-disable`s exhaustive-deps; `hasCreated.current` never resets when user clears cart and returns. Net effect: orphaned `incomplete_orders` rows accumulate. | `src/hooks/useCheckoutTracking.ts:51-79` | DB clutter + skewed recovery analytics. |
| H4 | **Order rejection reason not surfaced on dashboard** — `OrdersTab` shows status badge but never `order.rejection_reason`. Customers must click into `/track-order` to learn why an order was rejected. | `src/components/dashboard/OrdersTab.tsx:60-79` | Avoidable support tickets ("why was my order cancelled?"). |

### 🟡 MEDIUM priority — UX gaps and minor data issues

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | **Stale `useEffect` dep** — `TrackOrderPage` auto-load effect lists `[orderId, user]` but calls `fetchOrder(orderId)` (a `useCallback`) — `fetchOrder` not in deps. Works because `fetchOrder` only depends on stable refs, but is a lint smell. | `TrackOrderPage.tsx:56-61` | Future refactors may break the auto-load. |
| M2 | **`AuthPage` always redirects admins to `/admin`**, ignoring `?redirect=` — an admin clicking "Sign in to enroll" from a course detail page lands on the admin panel instead of the course. | `AuthPage.tsx:51-62` | Sole-admin policy makes this rare, but funnel-breaking when it happens. |
| M3 | **Footer "Categories" link slugs don't match DB taxonomy** — links go to `/shop?category=seeds`, `?category=fertilizers`, etc., but `ShopPage` filters on `productType` derived from DB categories ("Crops", "Livestock", "Fertilizer", "Equipment") and reads URL param `type`, not `category`. Footer category links produce empty results. | `Footer.tsx:15-20` vs `ShopPage.tsx:192,203` | Dead nav links. |
| M4 | **`NotFound.tsx` is reached on typo URLs but `RequireAdmin` redirects to `/`** instead of showing a 403 — non-admin signed-in users hitting `/admin/*` silently bounce home with no toast. | `RequireAdmin.tsx:22-23` | Minor: confusing for users who thought they had access. |
| M5 | **OrdersTab doesn't show an item thumbnail** — only a generic Package icon. Users with multiple orders can't visually scan for "the seeds order". | `OrdersTab.tsx:61-63` | Cosmetic. |
| M6 | **`ProductDetailPage` description fallback still mentions "pets and farm animals"** — Vetmedix-era copy leaked into the agri rebrand. | `ProductDetailPage.tsx:415` | Brand consistency. |
| M7 | **Enroll dialog has no success state inside the dialog** — it just closes; the toast is the only confirmation. A short inline "Request submitted, check your dashboard" panel would feel more polished. | `EnrollDialog.tsx:51-58` | UX polish. |
| M8 | **Geocode edge fn User-Agent still says `VetMedix/1.0`** — minor branding leak in outbound HTTP. | `supabase/functions/geocode/index.ts:105` | Branding only, no user impact. |

### 🟢 LOW priority — polish

| # | Issue | Location |
|---|---|---|
| L1 | `TrackOrderPage` shows order timeline but not the **list of items** until you scroll past the timeline card — could surface the first item thumbnail in the header. |
| L2 | `CartQuickPeek` shows up to 3 items but no "view full cart" affordance when items count ≤ 3 (only shows when there's a remainder). |
| L3 | `AcademyPage` empty-state for zero courses (no rows at all) reuses the "No matching courses" copy — should differentiate. |
| L4 | `HeroSection` has no animated entrance; first-paint feels static. |
| L5 | `ContactPage` `cooldown` is a number countdown but no visual progress indicator. |
| L6 | `ProductDetailPage` "100+ Sold" is hardcoded — either remove or wire to real data. |
| L7 | `useEnroll` invalidates `['enrollments']` but not the user-scoped key `['enrollments', user?.id]` — works because both are prefix-matched, but explicit is safer. |

---

## 3. What's already healthy (skip)

- Cart store + persistence, atomic checkout RPC, stock realtime sync, RLS posture, OAuth (Google/Apple), forgot-password flow, SEO + JSON-LD, sitemap, `OptimizedImage`, focus management, skip-link, mobile bottom nav with cart badge.

---

## 4. Execution roadmap (modular, one phase per approval)

**Phase 1 — Critical fixes (HIGH)** — ~4 small file edits
- H1: replace all `/academy/${id}` → `/course/${id}` and `/shop/${id}` → `/product/${id}` in 4 dashboard tile files.
- H2: fix `shop/ProductCard.tsx` → pass `image: product.image_url || ''` and remove the `as any` cast.
- H3: harden `useCheckoutTracking` — reset `hasCreated` when items go to 0, and bail out cleanly when the user navigates away.
- H4: add a small `RejectionReasonRow` inside `OrdersTab` cards when `order.status === 'rejected'` and `order.rejection_reason` is set.

**Phase 2 — UX gaps (MEDIUM)** — ~5 file edits
- M2: respect `?redirect=` for admins too (only fall back to `/admin` if no redirect was provided).
- M3: rewrite `Footer` category links to use real DB category slugs and the `type` URL param.
- M4: `RequireAdmin` shows the existing "Access Denied" card briefly, then redirects after a 1.5s toast — avoid silent bounce.
- M5: render the first item's thumbnail in `OrdersTab` cards instead of the generic icon.
- M6: replace Vetmedix-era fallback copy on `ProductDetailPage`.
- M7: optional inline success panel in `EnrollDialog`.
- M8: rename geocode UA to `ZAgroTech/1.0`.

**Phase 3 — Polish (LOW)** — optional
- L1–L7 grouped, applied only if Phase 1+2 ship cleanly.

### Constraints honored
- **Lock files**: no changes to `App.tsx` routes, `/admin/**`, `Layout`, or DB schema.
- **RLS**: all reads stay user-scoped via existing hooks; no new RLS-bypassing queries.
- **Aesthetic**: only semantic tokens + shadcn primitives.

### Decision needed
Reply with one of:
- **"Execute Phase 1"** — just the HIGH fixes (recommended first).
- **"Execute Phases 1+2"** — HIGH + MEDIUM together.
- **"Execute all phases"** — HIGH + MEDIUM + LOW polish.

