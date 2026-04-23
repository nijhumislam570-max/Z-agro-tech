

# Read-Only Audit — Shop Pages

Scope: `/shop`, `/product/:id`, `/track-order`. **No code changes** — findings only. Priority: **P1** (fix soon), **P2** (polish), **P3** (nice-to-have).

---

## A. `/shop` — Product Catalog

**Summary**: Infinite-scroll catalog (PAGE_SIZE=20) via `useInfiniteQuery` + Intersection Observer sentinel. Debounced search (300ms), URL-synced filters (`search/type/sort/price`), shadcn Select on desktop + bottom Sheet on mobile, hero with separate `featured-products` query and auto-rotating `HeroCarousel`. Realtime invalidation on `products` + `product_categories` (debounced 400ms). Server-side filtering for category/price/sort, client-side sort only for `top-rated`. ItemList JSON-LD + SEO present.

**Findings**

- **P1 — N+1 ratings query is paged-blind**. `useProductRatings(productIds)` fetches **every review for every loaded product** on each page change. As infinite scroll grows the visible list to 100+ items, the `IN (...)` clause grows unbounded and **the entire reviews query re-runs from scratch** on every new page load (because `productIds` array string changes). Worse, the hook is plain `useState/useEffect` — no React Query caching, no dedup, no stale-while-revalidate. Migrate to `useQuery({ queryKey: ['product-ratings', productIds], staleTime: 5min })` and consider a server-side aggregate view (`product_ratings_view`) returning `{product_id, avg_rating, review_count}` so the client never pulls raw rows.
- **P1 — `ratings` deps array uses `productIds.join(',')`** (line 40 of `useProductRatings`) — eslint-disabled implicit dep. If a product ID contains a comma it would collide; harmless in practice but fragile. Use the array directly with a stable reference or `JSON.stringify`.
- **P1 — `useDebounce` returns the search string but the query refetch fires on the **debounced** value** (`searchQuery`), while the URL-sync effect (line 209-216) ALSO depends on `searchQuery` — so URL only updates after debounce. Good. But the "Clear search" button updates `searchInput` (immediate), creating a **two-frame flash** before debounce settles. Acceptable. **However**, search uses raw `ilike('name', '%'+input+'%')` — Postgres LIKE supports wildcards; user input `%foo%` would match everything. Sanitize: `.replace(/[%_\\]/g, '\\$&')` before interpolation.
- **P1 — Featured products query doesn't paginate or filter** (line 219-232). Pulls every active+featured product on every shop visit. If you ever have 100+ featured items, it ships them all to the carousel which only displays 5-8. Add `.limit(10)`.
- **P2 — Hero carousel image is non-optimized** (line 141-149). `<img src={p.image_url}>` raw, no `OptimizedImage`/Supabase transforms, despite being the LCP-adjacent slot on tablet+. Same for hero background `shopHeroAgriculture` — static import, no `srcset`.
- **P2 — Carousel `onClick` handler isn't keyboard-accessible per dot**. Each dot is a button — ✅ ok. But the `Link` card itself has no focus-visible style — keyboard users can't see the active card.
- **P2 — `gridCols` state is local-only** — no localStorage persistence. Users repeatedly revert to 4 cols on every visit.
- **P2 — `productTypes` merges DB categories with categories from currently-loaded products** (line 293-302). On page 1 of infinite scroll, types from page 5+ products won't appear in the filter dropdown. Acceptable (DB list is canonical) but creates inconsistent UX as user scrolls. Trust DB list only.
- **P2 — `realtime` subscription** (line 305-326) invalidates `'shop-products'` and `'featured-products'` on **every** product change. An admin bulk-edit can fire 100+ events in a second; the 400ms debounce helps but the resulting invalidation forces a full refetch of all visible pages. Consider switching to optimistic patches via `setQueryData`.
- **P2 — `top-rated` sort is client-side only over the **currently loaded pages***. Page 1 shows top-rated of first 20 products, not top-rated overall. Misleading sort. Either disable infinite scroll under top-rated, or move sort server-side via the proposed ratings view.
- **P2 — `Recently Viewed` and `Featured Products` sections both use `ProductCard`** correctly with rating props, but `recentProducts` doesn't pass `avgRating`/`reviewCount` (line 807-820) → inconsistent display vs main grid. Either pass ratings or accept the divergence.
- **P2 — `<input type="text">` for search** instead of `type="search"` — loses the iOS keyboard's "Search" key affordance and the native clear button. Page already provides custom clear, so cosmetic.
- **P3 — `aria-label="Cart (3 items)"`** is great, but the cart link itself has no `aria-current` when on `/cart`. Minor.
- **P3 — `gridClass` builds three different className strings** with mostly identical `grid-cols-3` mobile cols. Could be simplified.
- **P3 — Skeleton count is fixed at 8** but actual `gridCols` of 6 shows only 1.3 rows of skeletons. Adjust dynamically.
- **P3 — Active-filter chips list `searchQuery`** but truncation isn't enforced. A 500-char search term would blow out the row.

**Risk**: 
- **No data leakage** — products are RLS-public for `is_active=true` only. Confirmed via schema.
- **Wildcard injection in search** (P1) — `%`/`_` characters in user input are treated as Postgres LIKE wildcards. Not a security hole (RLS still applies), but allows DoS-via-broad-LIKE on a large table. Sanitize.

**Verdict**: **Functionally rich but has a hidden N+1 ratings problem** and **client-side `top-rated` over partial data**. Search wildcard sanitization is the easiest security/perf win.

---

## B. `/product/:id` — Product Detail

**Summary**: Outer `Navigate` guard for missing `:id`, inner component fetches product → tracks recently-viewed → fetches related (4) → fetches reviews. All via raw `useState` + `useEffect` (no React Query). Lazy-imports `ProductCard` for related grid, lazy-imports `ProductReviewForm`. Quantity selector, sticky desktop buy box, mobile bottom buy box (NOT actually sticky), full SEO + Product/Breadcrumb JSON-LD.

**Findings**

- **P1 — No React Query** — three sequential awaits in one `useEffect`: product → recently-viewed → related → reviews (line 71-118). Total round-trips: 3 visible (+ 1 wishlist context). On slow networks this serializes ~1.5s of waterfall. Migrate each to `useQuery` with shared cache keys (`['product', id]`, `['product-related', id, category]`, `['product-reviews', id]`). Bonus: enables prefetching from `ShopPage` hover.
- **P1 — `relatedProducts` query selects `*`** (line 102-107) — pulls `description`, `images`, all columns for 4 cards that only need name/price/image/discount. Use the same column list as Shop's `select(...)`.
- **P1 — Reviews query selects `*` and has no pagination** (line 63-67). A product with 1,000 reviews ships every row. Limit to e.g. 20 with "Load more" + show count separately. Currently the reviews summary aggregate (avgRating, distribution) is computed client-side from all rows — same data is being computed twice (once here, once in `useProductRatings` on shop). Move to a DB view.
- **P1 — `<button>Reviews</button>` in the rating row** (line 391-393) does nothing — no scroll-to-anchor. Misleading affordance.
- **P1 — `productImages` falls back to `[image_url]`** but if `image_url` is also null, `productImages = [""]` → broken `<img src="">` request. Add a placeholder fallback.
- **P2 — Buy Box "sticky" only on desktop**. The mobile buy box (line 561-645) is **inline below the description** — not sticky. On a long-page mobile flow the user has to scroll back up to add to cart. A real sticky-bottom Add to Cart bar would be the standard pattern.
- **P2 — `selectedImage` state isn't reset when `id` changes**. If the user navigates from product A (3 images, on image 2) to product B (1 image), `selectedImage=2` references undefined → `productImages[2]` is undefined → blank image until next click. Reset to 0 on `id` change.
- **P2 — `quantity` not bounded by stock**. `setQuantity(quantity + 1)` allows 999 against a stock of 5 — only caught at checkout. Disable Plus when `quantity >= stock`.
- **P2 — `handleAddToCart` calls `addItem` in a loop** of `quantity` times (line 123-133). Cart context likely supports adding with quantity directly — this is N times the work + N realtime triggers + N optimistic updates.
- **P2 — `setProduct(data as Product)`** with `select('*')` (line 87) — type assertion masks DB-schema drift. With React Query, types come from the generated client.
- **P2 — `Share2` button has no handler** (line 313-318) — pure decoration. Implement Web Share API or remove.
- **P2 — `addToRecentlyViewed` is called inside `fetchProduct`** every time the page loads. If the user reloads 10 times, the recently-viewed list deduplicates (assumed) but each call still writes localStorage. Cheap but unnecessary.
- **P2 — `useDocumentTitle(product?.name)` AND `<SEO title={product.name}>`** both set the title. SEO is canonical; the hook is redundant.
- **P2 — Reviews "Verified Buyer" label** (line 714) is hard-coded — not actually verified. Either tie it to an `orders` lookup (verified purchase) or drop the label.
- **P2 — Rating star uses `text-warning fill-amber-400`** (line 381, 672, 722) — `fill-amber-400` is a raw Tailwind palette color, violating the semantic-token rule. Use `fill-warning`.
- **P3 — `lazy(() => import('@/components/ProductCard'))`** — saves bytes only if related products are below the fold. They're at the very bottom — ✅ justified.
- **P3 — Reviews list grid `md:grid-cols-2`** with no virtualization. 1,000 reviews × 2 cols = 500 DOM nodes.
- **P3 — `if (!id) return <Navigate to="/shop">`** — but `useParams` returns string from React Router; `id` would be present for matched routes. The guard is defensive — fine.

**Risk**: 
- **No data leakage** — products RLS-public for active products; reviews RLS allows authenticated read of all reviews (no PII fields exposed beyond rating + comment + user_id).
- **`reviews.user_id` is exposed** to all authenticated users — potentially used to correlate ratings to accounts. Acceptable for a public review system, but worth noting.

**Verdict**: **Functionally complete but architecturally inconsistent** — only page in this set without React Query. Top wins: cache layer, reset selectedImage on id change, bound quantity by stock.

---

## C. `/track-order` — Track Order

**Summary**: Auth-gated lookup. UUID regex pre-checks the order ID; falls back to `tracking_id` on no-UUID or no-match. Realtime updates via `postgres_changes` filtered to the active order. Renders timeline + items + status badge. Auth-gated since the previous audit pass.

**Findings**

- **P1 — Auth gate contradicts both the route name and the page copy**. The page is sold as "track your order with your Order ID — no login needed" in shop UX copy. Today, anonymous visitors see a Login Required card. Either:
  - **(a) Lift the auth gate** and let RLS handle access (RLS only allows `auth.uid() = user_id`, so guests see "not found" for any ID — leaks zero data). The current `Login Required` card is a UX block, not a security control. **Recommended**: remove auth gate, let RLS fail closed.
  - **(b) Keep the gate** but rename the route copy and remove the "no login needed" promise from sitemap/marketing.
- **P1 — Tracking ID search is auth-bound by RLS**. A user who places an order then logs out and pastes the tracking ID gets "not found". Consider a **separate** anonymous-friendly RPC like `get_order_tracking_summary(tracking_code text)` that returns ONLY status + estimated delivery (no items, no addresses, no totals) — keyed off `tracking_id` (which is only known to the customer + courier). This is the industry pattern for guest tracking.
- **P1 — `items: any[]`** typed as `any` (line 35, 122, 347) — defeats TS. Define a strict `OrderItem` type.
- **P1 — UUID regex is permissive**. `^[0-9a-f]{8}-[0-9a-f]{4}-...{12}$/i` — accepts non-version UUIDs. Acceptable for filter-pre-check, but if you want strict v4: include the `4` and `[89ab]` group bits.
- **P2 — `realtime` subscription is set up only AFTER an order is loaded** (line 107-131). If the user is on the page when the order status changes BUT they haven't searched yet, no update — fine. But the channel name uses the order ID — if the user searches a second order, the previous channel is correctly unsubscribed via the cleanup. ✅
- **P2 — `setOrder(null)` on error toasts "Could not fetch order details"** (line 89-91). RLS denial returns no error (just empty data) → user sees "Order not found" empty state. ✅ Correct (no enumeration).
- **P2 — No rate limiting** on the search button. Anonymous (if gate lifted) or authenticated user could brute-force tracking codes. Recommend a 1s client cool-down + Cloudflare/Supabase-level rate limit on the orders table read.
- **P2 — Total computed client-side as `item.price * item.quantity`** (line 369) — but `total_amount` is fetched from DB (line 375). The two can diverge if items were edited post-order. Use `total_amount` exclusively or label "Items subtotal" vs "Total".
- **P2 — `format(new Date(order.created_at), 'PPP')`** — locale-aware but no Bangla locale loaded. Bangla users see English dates.
- **P2 — `OrderTrackingTimeline`** (line 296) is a client component — when the courier consignment is set, does it call a Steadfast edge function? If yes, every track-order page view triggers a courier API call → cost + rate-limit concern.
- **P3 — `searchInput` not URL-synced**. If a user shares the page after searching, the recipient lands on an empty form.
- **P3 — Empty state copy** ("You can only view orders placed with your account") confirms the auth gate is intentional → conflicts with the marketing claim.
- **P3 — `Badge` text shows raw status string** (`pending`, `accepted`) — not capitalized/humanized. Cosmetic.

**Risk**: 
- **NONE on data exposure** — RLS correctly fails closed; tracking ID is treated as auth-required. **The risk is the opposite — UX promised public tracking is gated.**
- **Brute-force tracking IDs** would require knowing valid UUIDs — infeasible without leakage; tracking codes are typically short alphanumeric and a separate concern.

**Verdict**: **Secure but UX-mismatched**. The biggest decision is the auth gate: lift it (with a slim public RPC) to honor the marketing promise, or accept the tradeoff and update the copy.

---

## Cross-Page Shared Issues

### Critical / High (P1)

1. **N+1 ratings problem** (`/shop`): client pulls every review row for every visible product on every page. **Highest-impact fix**: add a Postgres view `product_ratings` aggregating `avg(rating), count(*)` per `product_id`, expose via RLS-public read, query once. Eliminates the entire `useProductRatings` round-trip, fixes the `top-rated` sort to be server-side over the FULL catalog, and shrinks `/product/:id` reviews payload.
2. **Search wildcard injection** (`/shop`): unsanitized `%` and `_` in `ilike()` patterns. Sanitize before interpolation.
3. **`/product/:id` has no React Query layer**: the only page in this set still using raw `useState/useEffect`. Inconsistent with the rest of the app, blocks prefetching.
4. **`selectedImage` not reset on product change** (`/product/:id`): blank image after navigating between products with different image counts.
5. **Track Order auth gate vs marketing promise**: pick one and align both code + copy.

### Medium (P2)

6. **Featured products query unbounded** (`/shop`).
7. **Hero LCP image not responsive** (`/shop` carousel + background).
8. **Quantity not bounded by stock** (`/product/:id`).
9. **Reviews unpaginated** (`/product/:id`).
10. **Mobile buy box not sticky** (`/product/:id`) — major mobile UX gap.
11. **Recently Viewed cards lack ratings** — inconsistent with main grid.
12. **`top-rated` sort is over partial data** (`/shop`).
13. **`useDocumentTitle` + SEO double-set title** (`/product/:id`).
14. **Hardcoded `fill-amber-400`** (`/product/:id`) — token violation.
15. **`items: any[]` typing** (`/track-order`).
16. **Real-time invalidation thrash** (`/shop`) — admin bulk edits trigger full refetches.

### Low (P3)

17. **`<input type="text">` instead of `type="search"`** (`/shop`).
18. **No `aria-current` on cart link**.
19. **Bangla locale not loaded** for date formatting.
20. **"Verified Buyer" label is fake** (`/product/:id`).
21. **Unimplemented Share button** (`/product/:id`).
22. **`<button>Reviews</button>` does not scroll** (`/product/:id`).
23. **Skeleton count fixed at 8** regardless of grid density.

### Confirmed Strengths

- ✅ Filters URL-synced (`/shop`) — share/bookmark works.
- ✅ Mobile filter sheet caps at `max-h-[80vh]` per memory rule.
- ✅ Real-time subscription is per-order on `/track-order`, properly torn down.
- ✅ ItemList + Product + Breadcrumb JSON-LD all present.
- ✅ Outer `<Navigate>` guard on `/product/:id` keeps hook order stable.
- ✅ UUID pre-check on `/track-order` prevents 400 errors that would skip the tracking_id fallback.
- ✅ `auth.uid() = user_id` RLS on orders + reviews — no data leakage.
- ✅ Infinite scroll uses Intersection Observer, not scroll listener.
- ✅ Featured products query separated from main paginated query — independent caching.
- ✅ Mobile category/price/sort uses 44px touch targets.
- ✅ All semantic landmarks (`<main id="main-content">`, single `<h1>` per page) present.

### Recommended Fix Order

1. **P1 PERF**: Create `product_ratings` DB view + migrate `useProductRatings` to React Query. Unlocks server-side `top-rated` sort.
2. **P1 SEC**: Sanitize `%`/`_`/`\` in shop search input before `ilike()`.
3. **P1 ARCH**: Migrate `/product/:id` to React Query (`['product', id]`, `['product-related', id]`, `['product-reviews', id]`); enables prefetching from shop hover.
4. **P1 BUG**: Reset `selectedImage` to 0 when `id` changes; add fallback for empty image arrays.
5. **P1 PRODUCT**: Decide on `/track-order` auth gate. If lifting: add anonymous RPC returning sanitized tracking summary. If keeping: update marketing copy.
6. **P2 PERF**: Limit featured products query; switch hero carousel/background to `OptimizedImage` + responsive `srcset`.
7. **P2 UX**: Sticky-bottom mobile Add to Cart bar; bound quantity by stock; paginate reviews; pass ratings to Recently Viewed cards.
8. **P2 POLISH**: Replace `fill-amber-400` with `fill-warning`; drop redundant `useDocumentTitle`; type `items` strictly.

Reply **go** to switch to default mode and apply this plan, or call out which items to skip.

