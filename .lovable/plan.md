

# Read-Only Audit — Dashboard

Scope: `/dashboard` and its `?tab=` views (`orders`, `courses`, `wishlist`, `profile`). **No code changes** — findings only. Priority: **P1** (fix soon), **P2** (polish), **P3** (nice-to-have).

---

## A. `/dashboard` — Shell, Hero & Bento Grid

**Summary**: `<RequireAuth>` gate → `DashboardPage` wrapped in `ErrorBoundary`. Hero (greeting + edit button) + 4-card stat grid + bento grid (Recent Orders, Quick Actions, Alerts, Learning Path, Recommended Inputs, Masterclass, Featured Carousel) + Tabs section. Tab state in `?tab=` query param, validated against `VALID_TABS`. Shadcn/Radix Tabs (lazy: only the active `TabsContent` mounts its children). `noIndex` SEO. Single `<h1 className="sr-only">`.

**Findings**

- **P1 — Bento grid + tabs render every tile + active tab on every visit, regardless of intent**. Visiting `/dashboard?tab=profile` still mounts `RecentOrdersList`, `AlertsTile`, `LearningPathTile`, `RecommendedInputsTile`, `MasterclassTile`, and `FeaturedCarouselTile` above the fold. Each fires its own queries (`useDashboardSummary` → `useMyOrders` + `useMyEnrollments`, `useFeaturedMasterclass`, `useRecommendedProducts`, `useFeaturedAgri` which itself adds a `featured-courses` query, plus `useWishlistProducts` inside `AlertsTile`). For a user who only wants to edit their profile, the dashboard issues **6+ Supabase requests** they never look at. This is the dashboard's biggest perf cost and undermines the "lazy loading" goal.
- **P1 — `useWishlistProducts` is called twice in parallel** (once in `WishlistTab`, once in `AlertsTile`) and is **not React-Query backed** (raw `useState` + `useEffect` + `supabase.from('products').in('id', ids)`). Two component instances → **two duplicate network calls**; no caching across navigation; no dedupe; no stale-while-revalidate. Also no error UI — failures silently set empty array. Migrate to `useQuery({ queryKey: ['wishlist-products', sortedIds] })` with a stable cache key.
- **P1 — `AlertsTile` "low stock" relies on `wishlistProducts.stock`**, but `useWishlistProducts` does not refresh on focus and the `stock` value is whatever was returned at first load. Stock can drop to 0 without the alert ever updating until the user reloads. With React Query, set `refetchOnWindowFocus: true` + a short stale time.
- **P1 — `useDashboardSummary` is called in three places** (`DashboardStatGrid`, `RecentOrdersList`, `AlertsTile`). Each call wires the same `useMyOrders` + `useMyEnrollments` queries, so React Query will dedupe — ✅ — but every component re-renders whenever either underlying query changes. That's fine, but the `recentOrders.slice(0,3)` happens inside the hook, which returns a **new array reference every render**, breaking memoization for downstream `useMemo`s if any are added.
- **P2 — Tab labels are `hidden sm:inline`** so on mobile (<640px) the four tabs show only icons. With `aria-label` set ✅ for SR users, but sighted users see four indistinguishable square icons until they tap. Consider a 2-line layout (icon + tiny label) on mobile.
- **P2 — Tab change uses `setSearchParams(prev → next, {replace: true})`** which is correct (no history spam), but every tab switch causes the entire page to re-render including the bento grid and hero. Wrap the tab section + the bento grid in `React.memo` boundaries OR move tabs into a separate component that owns the param.
- **P2 — `Hero` greeting depends on `useProfile()`**, but `EditProfileSheet` also reads `useProfile()` via `DashboardPageInner`, and `WishlistTab` does not. Fine — react-query dedupes — but the `Hero`'s `greetingName` `useMemo` re-derives on every profile change, including avatar URL changes, which fires a re-render of the whole hero section.
- **P2 — `useFeaturedAgri` fetches `featured-courses` separately** but `useFeaturedMasterclass` (in `MasterclassTile` and `AlertsTile`) fetches a separate single-row courses query. Three overlapping course queries on the same page (`useMyEnrollments` joins courses, `useFeaturedMasterclass` selects 1, `useFeaturedAgri` selects 3). Could be unified into one `useDashboardCourses` query.
- **P2 — `Hero`'s "Edit profile" button** sits next to the greeting; on mobile it's full-width-ish but the Edit profile button in `ProfileTab` does the same job. Two entry points to the same sheet — minor redundancy.
- **P2 — `DashboardErrorFallback`** is well-built but the error boundary wraps the whole `DashboardPageInner`, so a single tile crash takes down the entire dashboard (orders, profile, etc.). Wrap each bento tile in its own `ErrorBoundary` so a broken `MasterclassTile` doesn't kill `OrdersTab`.
- **P2 — `BentoGrid` uses `lg:grid-cols-12`** with tiles claiming `lg:col-span-8`, `4`, `5`, `7`, `4`, `12`. On `md` (768-1023px) tiles collapse to single column → stacked tiles produce a long scroll. Add an intermediate `md:grid-cols-2` layout.
- **P3 — `DashboardStatGrid` "Lifetime Spend"** formatter uses `>= 1000` threshold for the `k` suffix; `৳999` shows as "৳999" but `৳1000` jumps to "৳1.0k" — minor visual jump.
- **P3 — `Hero`'s `today` `useMemo([])`** computes once on mount; if a user keeps the dashboard open past midnight, the date is stale.
- **P3 — `<h1 className="sr-only">Your Z Agro Tech Dashboard</h1>`** ✅ memory rule satisfied, but the visible "Welcome back, {name}" is `<h2>` inside the hero — fine semantically.
- **P3 — `Tabs` uses `replace: true` for URL updates** — correct, but losing other query params (e.g. coming from `?utm_source=...&tab=orders`) is preserved correctly via `new URLSearchParams(prev)` ✅.

---

## B. `/dashboard?tab=orders` — Orders Tab

**Summary**: `OrdersTab` → `useMyOrders` (RLS-scoped to `auth.uid() = user_id`, excludes trashed). Card per order with status badge, thumbnail from first item, total, rejection reason if applicable. Click navigates to `/track-order?id=X`.

**Findings**

- **P1 — `useMyOrders` query selects `items` JSON unfiltered**. The full cart payload (every item's name, image, qty, price) is returned for **every order**, on **every dashboard mount**. A power user with 50 orders × 10 items each ships ~500 entries each visit. Use a server-side computed column or a dedicated RPC like `get_my_recent_orders` returning summary fields + `first_item_image`.
- **P1 — `useMyOrders` has no pagination**. `.order('created_at', desc)` with no `.limit()` → grows linearly. After 100 orders the dashboard tab loads slowly and the network payload balloons. Add `.limit(50)` + a "Load more" button.
- **P1 — `<img src={thumb}>` has no `loading="lazy"`** in the orders list (line ~73 of OrdersTab). Orders tab can render dozens of thumbnails; all eagerly load.
- **P2 — Orders tab has no filter/search**, no status chip-row. Users with many orders can't quickly find "delivered" or "pending". Add a status filter chip row (memory rule: dashboards-as-filters).
- **P2 — `statusVariants` uses raw color classes** like `bg-warning/15 text-warning-foreground` ✅ semantic tokens, but the dashboard's own `RecentOrdersList` (in the bento) uses `statusTone()` with `*-soft`/`*-border` variants — **inconsistent badge styles** for the same statuses on the same page.
- **P2 — Order card has no aria-current** when the user navigates back from /track-order; no indication of which order they came from.
- **P2 — Empty state is static** ("No orders yet") — no recommended-products CTA inline, just a "Browse shop" link. Could promote one featured product.
- **P3 — `order.id.slice(0,8)`** displayed as plain text without `font-mono` here (vs `RecentOrdersList` which uses uppercase + `font-mono`). Inconsistent.
- **P3 — `items as Array<...>` cast** is unsafe; `items` is `Json` from Supabase types. A malformed row crashes the render. Add a runtime guard.

---

## C. `/dashboard?tab=courses` — Courses Tab

**Summary**: `CoursesTab` → `useMyEnrollments` (RLS-scoped, joins `courses` + `course_batches`). Cards show status + duration badges, batch info, progress bar (only for `confirmed`/`completed`), "View course" button.

**Findings**

- **P1 — `useMyEnrollments` join (`course:courses(...), batch:course_batches(...)`) returns full course + batch rows for every enrollment on every dashboard visit** (this hook is also called by `LearningPathTile` in the bento). Two consumers, fine due to dedupe, but the join shape is fixed at `STALE_1MIN` so any course/batch update doesn't surface for 60 s. Cancellation/seat-fill changes lag.
- **P2 — No pagination/limit** on enrollments either. Acceptable since few users have >20 enrollments today, but unbounded.
- **P2 — `statusStyle.cancelled = bg-muted`** while the status filter color memory rule mandates **Red** for rejected/cancelled. `OrdersTab` uses red for cancelled but `CoursesTab` uses neutral grey — inconsistent across same dashboard.
- **P2 — Course cards have no thumbnail** (only an icon tile), while the bento `LearningPathTile` shows a hero image. Stylistic inconsistency; the courses tab feels much sparser than the rest of the dashboard.
- **P2 — "View course" button text** is the same for `pending`, `confirmed`, `completed`. For `pending`, "Awaiting confirmation" or "View status" is more honest; for `completed`, "View certificate" is more useful.
- **P3 — `Math.min(100, Math.max(0, e.progress ?? 0))`** — defensive ✅, but `e.progress` is typed `number` non-null in `Enrollment` interface; the `?? 0` is dead.
- **P3 — Empty state's CTA "Browse academy"** is exactly the academy hero CTA — fine.

---

## D. `/dashboard?tab=wishlist` — Wishlist Tab

**Summary**: `WishlistTab` → `useWishlistProducts()` (uses `useWishlist` context's `wishlistIds`, then queries `products` `.in('id', ids)`). Renders shop `ProductCard` grid; `EmptyState` if empty.

**Findings**

- **P1 — `useWishlistProducts` is not React-Query backed** (see /dashboard A above). Critical issues:
  - **No cache** — leaving the tab and returning re-fetches.
  - **Duplicate fetches** — `AlertsTile` and `WishlistTab` both call it independently (network duplicated).
  - **No `refetchOnWindowFocus`** — admin updates to stock/price never surface.
  - **No error state** — failures silently render empty (looks identical to "no wishlist").
- **P1 — `useWishlist` context fetches the wishlist IDs but never re-runs unless auth changes**. If a user wishlists a product on `/shop` (which optimistically updates the in-memory set), then opens this tab in another tab, the second tab sees stale state. Set up Supabase Realtime on `wishlists` OR refetch on visibility change.
- **P1 — `.in('id', ids)` array key in `useEffect` deps** — `wishlistIds` is a `Set` reference that changes on every emit. Since `Array.from(wishlistIds)` is computed inside the effect, the dep array `[wishlistIds]` re-runs the fetch any time the set is replaced (even with same contents). Each toggle re-fetches all wishlist products even though only one ID changed.
- **P2 — `EmptyState` is great**, but no "view recently viewed" or "trending products" CTA.
- **P2 — Grid is `sm:grid-cols-2 lg:grid-cols-3`** but `ProductCard` uses its own internal layout — no row-height normalization, so cards with longer names get taller than neighbors → uneven grid.
- **P3 — Loading skeleton is hardcoded `h-72`** which is fine but doesn't match `ProductCard`'s actual height (looks like ~340px).

---

## E. `/dashboard?tab=profile` — Profile Tab

**Summary**: `ProfileTab` → `useProfile()` (react-query backed, `STALE_5MIN`, `upsert` on `user_id`). Avatar with email, info grid (name/phone/region/address), "Complete your profile" nudge if all fields empty, Edit button → `EditProfileSheet`. Sheet uses `react-hook-form` + Zod (`profileSchema`), cascading division→district→thana selects from `bangladeshRegions`.

**Findings**

- **P1 — `EditProfileSheet` is mounted unconditionally in `DashboardPageInner`** (line 188) and **also re-rendered inside `ProfileTab`**? — actually no, only in `DashboardPageInner`. ✅ But the outer sheet uses the `profile` from `DashboardPageInner`'s `useProfile` while `ProfileTab` opens a **second** `<EditProfileSheet>` (line 78 of ProfileTab.tsx). **Both sheets coexist on the page.** Two `<Sheet>` instances with separate `editOpen` state → on profile tab, the user sees the page's edit button at the top AND the tab's edit button; they open *different* sheet instances backed by the same `useProfile` hook. Unconfusing in practice (both show the same data) but doubles up DOM and listeners.
- **P1 — `profileSchema` accepts `phone` with no format validation** (saw `phone: z.string().max(20).optional().or(z.literal(''))` in lines 78-80). Same lax validation as the legacy checkout schema before its fix. Apply the same `checkoutPhoneRegex` (`/^[+\d\s-]{6,20}$/`) here for consistency, OR let users save garbage that breaks at checkout.
- **P1 — Cascading selects' `setValue('district', '')`/`setValue('thana', '')`** on division change is correct ✅, but does **not trigger validation** until the user blurs a field. Current behavior: pick "Dhaka", then "Faridpur" → district resets but the form stays "valid" with district=''. On submit, Zod fires `min(1)` errors. Fix: pass `{ shouldValidate: true }` or call `form.trigger(['district','thana'])` after reset.
- **P1 — `updateProfile` returns `boolean`** (success/fail) by swallowing the mutation error in a `try/catch` (lines 86-93 of useProfile). The toast inside `mutation.onError` shows the error, but the form sheet closes only on `ok`, otherwise stays open with no inline error attribution → user sees a generic toast and an unchanged form, doesn't know which field caused it.
- **P2 — `mode: 'onChange'`** on `useForm` re-validates on every keystroke; with 6 fields including expensive cascading select recomputes (`getDistricts`, `getThanas` per render), this is more work than needed. Switch to `mode: 'onBlur'` + final `onSubmit`.
- **P2 — `getDivisions/getDistricts/getThanas`** wrapped in `useMemo` on `division`/`district` ✅, but `divisions` doesn't change so `useMemo([], () => getDivisions())` is the right pattern (it is). District list, however, is recomputed on every keystroke in any field because `division` is read via `form.watch('division')` which subscribes the whole component to all fields → component re-renders → memo deps re-evaluated → `division` value identical → memo cache hit. Fine, but rendering the entire form on every keystroke is wasteful. Use `useWatch({ control, name: 'division' })` to scope re-renders.
- **P2 — `ProfileTab`'s "Complete your profile" CTA** triggers when `!full_name && !phone && !address && !division`. Doesn't include `district`/`thana`/`avatar`. A user with only `division` set hides the CTA but is still 80% incomplete.
- **P2 — `Field` component renders "Region"** as `${thana}, ${district}, ${division}` — good — but if only thana is set (e.g. legacy data), it shows just "thana" which looks weird.
- **P2 — No avatar upload**. `profile.avatar_url` is rendered but the EditProfileSheet has no field to set it. Dead column from the user's POV.
- **P3 — `profileSchema` does not check `district ⊆ getDistricts(division)`** — if a user manually crafts a request with division="Dhaka", district="Sylhet", the schema accepts it. RLS doesn't care; only the cascading dropdown UI prevents this. Server-side check would be good defense in depth.
- **P3 — Edit button on `ProfileTab` is `Pencil` icon + "Edit"**, while the Hero uses the same icon + "Edit profile". Minor copy inconsistency.

---

## F. Cross-Cutting Dashboard System Issues

### Security & RLS

- ✅ `orders.SELECT` policy: `auth.uid() = user_id` → user-scoped.
- ✅ `enrollments.SELECT` policy: `auth.uid() = user_id OR has_role(...,admin)` → user-scoped.
- ✅ `wishlists.SELECT` policy: `auth.uid() = user_id` → user-scoped.
- ✅ `profiles.SELECT/UPDATE/INSERT`: `auth.uid() = user_id` → user-scoped.
- ✅ `<RequireAuth>` wraps `/dashboard` route.
- **P2 — No defense-in-depth on the client**. If RLS were ever misconfigured, every hook (`useMyOrders`, `useMyEnrollments`, etc.) would happily render any rows returned. Adding `.eq('user_id', user.id)` is currently done ✅, but the joined data inside `useMyEnrollments` (`course:courses`, `batch:course_batches`) is **not** filtered by user — relies entirely on the `enrollments`-table RLS to control which rows are joined. If an attacker found a way to read another user's enrollments row, they'd also get the joined course/batch data. Fine today; document the dependency.
- **P2 — `profileSchema` is sanitization-light** for the `address` field — `noXSSRegex` ✅, but no length cap on what looks like a free-text street address (capped at default `z.string().max()` which is `Infinity`). The DB column is `text` unbounded.

### Data Flow / React Query

- **P1 — Three places call `useDashboardSummary`** (StatGrid, RecentOrdersList, AlertsTile). Hook returns a fresh object every render because of the `slice(0,3)` and `filter(...)` calls. Wrap derived values in `useMemo` inside the hook OR push them into the `select` of `useQuery`.
- **P1 — `useWishlistProducts` is the only non-React-Query data hook** in the dashboard tree → cache desync, double fetches, no error UI, no refetch-on-focus.
- **P2 — Stale times are 1 min** for orders/enrollments/recommended/featured. For Recommended Products and Featured Carousel, 5 min would be plenty (admin product changes don't need to surface to the customer in <1 min).
- **P2 — `useFeaturedAgri` interleaves products + courses** but the underlying queries have separate stale times (both `STALE_1MIN`). If they refetch at slightly different times, the carousel re-renders with different content order temporarily.

### Performance

- **P1 — All dashboard tiles fetch on initial mount** even when the user lands on `?tab=profile`. **No tile is gated by tab visibility.** Lazy load or defer below-the-fold tiles.
- **P1 — `<img>` tags in `OrdersTab` and `LearningPathTile` lack `width`/`height`** → CLS as orders load. Same issue from cart audit; fix systematically.
- **P2 — `useMyEnrollments` and `useMyOrders` have no `.limit()`** → unbounded growth. Cap at 50 with "Load more".
- **P2 — Bento grid renders 6 tiles regardless of value to user**. Move `MasterclassTile` + `FeaturedCarouselTile` below a fold OR lazy-load via `IntersectionObserver`.
- **P3 — `DashboardStatGrid` re-renders on any wishlist toggle** because `useWishlist().wishlistIds` is a `Set` whose reference changes on every `emitChange`.

### UI / UX

- **P2 — Tab triggers' icons-only on mobile** (`hidden sm:inline` labels) hurts discoverability. Test: a brand-new user sees four square icons and has to tap each.
- **P2 — Bento grid + tabs + hero on a single scroll** is 3+ screens of content for desktop; mobile is 6+ screens. A user who lands on `?tab=profile` scrolls past everything before seeing their profile. Consider moving the tabs above the bento grid OR collapsing the bento on `?tab=` non-default.
- **P2 — Empty states inconsistent** — `WishlistTab` uses `<EmptyState>` primitive ✅, while `OrdersTab` and `CoursesTab` use ad-hoc `<Card><CardContent>` empty states. Standardize to `EmptyState`.
- **P2 — Status badge color tokens differ across tiles**:
  - `OrdersTab`: `bg-warning/15 text-warning-foreground` (one style)
  - `RecentOrdersList` (bento): `bg-warning-soft text-warning-foreground border-warning-border` (another style)
  - `CoursesTab`: `bg-accent/15 text-accent` (third style)
  - Pick one and apply consistently. Memory rule mandates: pending=Amber, approved=Green, rejected=Red, shipped=Blue.
- **P3 — No skip-to-tabs link** within the dashboard; user must Tab through hero + 4 stat cards + 6 bento tiles before reaching the tab list.

### Forms (Profile)

- **P1 — Phone has no format validation** (already noted, P1 above).
- **P1 — Cascading select reset doesn't re-validate** (already noted, P1 above).
- **P2 — `mode: 'onChange'`** + full-form `useWatch` causes excessive re-renders.
- **P2 — Address has no length cap** in schema.
- **P2 — No avatar upload field** even though `avatar_url` is rendered.

---

## Recommended Fix Order

1. **P1 PERF**: Migrate `useWishlistProducts` to React Query; share cache between `WishlistTab` and `AlertsTile`.
2. **P1 PERF**: Lazy-load below-the-fold bento tiles (`MasterclassTile`, `FeaturedCarouselTile`, optionally `RecommendedInputsTile`) via `IntersectionObserver` OR conditionally render bento only when `tab=orders` (or no tab).
3. **P1 PERF**: Add `.limit(50)` + "Load more" to `useMyOrders` and `useMyEnrollments`. Drop `items` shape down to a summary in a server-side RPC for the orders list.
4. **P1 CORRECTNESS**: Add phone format regex to `profileSchema` (mirror checkout's). Add `shouldValidate: true` to cascading-select resets.
5. **P1 UX**: Remove the duplicate `<EditProfileSheet>` instance in `ProfileTab.tsx` — keep only the page-level one and trigger via a callback.
6. **P1 PERF**: Wrap each bento tile in its own `ErrorBoundary` so a single tile crash doesn't kill the dashboard.
7. **P2 PERF**: Memoize `useDashboardSummary`'s derived values (`recentOrders`, filters) so consumers get stable references.
8. **P2 UX**: Standardize empty states to `<EmptyState>`; standardize status badge tokens to a single `statusBadgeClass(status)` utility.
9. **P2 UX**: Show short labels on mobile tab triggers (icon + 1-line label).
10. **P2 PERF**: `EditProfileSheet` use `useWatch` instead of `form.watch`; flip to `mode: 'onBlur'`.
11. **P3 POLISH**: Add `loading="lazy"` + `width`/`height` to all dashboard `<img>`s; add `font-mono` to all order ID renderings; date in Hero recomputes on focus.

### Confirmed Strengths

- ✅ RLS is correctly user-scoped on every dashboard table (`orders`, `enrollments`, `wishlists`, `profiles`).
- ✅ `<RequireAuth>` gates `/dashboard`.
- ✅ Tab state in URL (sharable, back-button-friendly).
- ✅ Radix Tabs lazy-mounts content (only the active tab's `<TabsContent>` renders its tree).
- ✅ `ErrorBoundary` around `DashboardPageInner` prevents whole-app crash.
- ✅ `useProfile` is React-Query backed with optimistic toast UX and `upsert` on conflict.
- ✅ Cascading region selects from canonical `bangladeshRegions.ts` (memory-rule compliant).
- ✅ `noIndex` SEO + `<h1 className="sr-only">` + `<main id="main-content">` (memory rule).
- ✅ 44px min touch targets on tabs, buttons, hero edit.
- ✅ `useDashboardSummary` derives from existing cached queries — no duplicate orders/enrollments fetch.
- ✅ `STALE_*` constants used consistently from `queryConstants.ts`.
- ✅ `EmptyState` primitive exists and is used in `WishlistTab`.

Reply **go** to switch to default mode and apply this plan, or call out which items to skip.

