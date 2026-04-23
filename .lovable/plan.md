

# Z Agro Tech — Consolidated Audit Roadmap

Synthesis of all prior audits (Cart, Checkout, Dashboard, Routing/404/Guards) plus already-shipped fixes. Decisive, prioritized, actionable.

---

## 1. Top Critical Issues (fix immediately)

| # | Issue | Surface | Why it's critical |
|---|---|---|---|
| C1 | **Server-side price/total trust** — checkout posts `subtotal`, `delivery`, `total` from the client. No DB trigger recomputes against `products.price`. | `/checkout` → `orders` insert | **Price tampering risk.** A modified client can place a ৳1 order. Highest-severity commerce bug. |
| C2 | **Stock not decremented atomically on order placement** — concurrent checkouts can oversell the same unit. | `/checkout` mutation | Inventory integrity. Already partially mitigated by client-side cart cap, but server is the source of truth. |
| C3 | **`useMyOrders` returns full `items` JSON for every order, no `.limit()`** *(addressed in Dashboard sprint, verify shipped)* | `/dashboard?tab=orders` | Payload balloons linearly; mobile users on slow networks hit multi-MB responses. |
| C4 | **Coupon validation is client-only** — discount applied in JS, sent to server as a number. | `/checkout` | Same class as C1: anyone can forge a 100% discount. |

---

## 2. High Impact Fixes (next priority)

| # | Issue | Surface |
|---|---|---|
| H1 | **No rate limiting on order placement** — nothing stops a script from posting 1000 orders. Add Postgres function or edge function with per-user throttle. | `orders` insert |
| H2 | **Checkout success state lives in component** — page reload loses confirmation. Move to `?orderId=` URL param + dedicated `/order-confirmation/:id` route. | `/checkout` |
| H3 | **Cart `useDeliveryCharge` recomputes on every keystroke** in address fields. Debounce 300ms. | `/cart`, `/checkout` |
| H4 | **No session-staleness guard** — user with expired token in another tab can mount `/checkout`, fire mutation, get 401. Add `supabase.auth.getSession()` check before submit. | `/checkout` |
| H5 | **Admin actions (approve/reject order, delete user) lack confirmation audit trail** — no `admin_actions` log table for compliance. | `/admin/*` |
| H6 | **Wishlist/cart sync race on multi-tab** — Supabase Realtime not subscribed; tabs diverge. | `/cart`, `/dashboard?tab=wishlist` |

---

## 3. Medium Improvements

- **M1** — Standardize `EmptyState` usage across remaining ad-hoc empty states (admin tables, search results).
- **M2** — Promote `useUuidParam` to all remaining `:id` routes (admin order detail, enrollment detail).
- **M3** — Add `react-hook-form` + Zod to remaining admin forms still using local state (audit `AdminCoupons`, `AdminDeliveryZones`).
- **M4** — Stale times: bump recommended/featured queries from `STALE_1MIN` → `STALE_5MIN`.
- **M5** — Add `width`/`height` to all remaining `<img>` (audit Academy, Shop product cards).
- **M6** — Add `loading="lazy"` to below-the-fold images globally.
- **M7** — Address field length cap in `profileSchema` and `checkoutSchema` (currently unbounded).
- **M8** — Server-side validation that `district ⊆ getDistricts(division)` via DB trigger.
- **M9** — `RequireAdmin` "Access Denied" flash — shorten to 600ms or use immediate `<Navigate>`.
- **M10** — Production 404 logging → wire `NotFound`/`AdminNotFound` `logger.warn` to a `route_404_log` table for dead-link repair.

---

## 4. Low Priority Polish

- **L1** — Case normalization (`/Shop` → `/shop`) via top-level redirect.
- **L2** — "Did you mean…?" suggestions on 404 (Levenshtein vs route table).
- **L3** — `RequireAuth` 10s timeout safeguard with retry UI.
- **L4** — `Hero` greeting `today` recomputes on visibility change (handles past-midnight sessions).
- **L5** — Skip-to-tabs link on dashboard.
- **L6** — `font-mono` on all order ID renderings (still inconsistent in 1-2 spots).
- **L7** — Avatar upload field in `EditProfileSheet` (column exists, no UI).
- **L8** — `LifetimeSpend` formatter smooth transition at ৳1000 boundary.
- **L9** — Course card thumbnails in `CoursesTab` (currently icon-only).
- **L10** — "View certificate" / "Awaiting confirmation" status-aware CTAs in courses tab.

---

## Route-by-Route Health Summary

| Route | Status | Top remaining risk |
|---|---|---|
| `/` (Index) | 🟢 Healthy | None critical (not deeply audited this round) |
| `/shop` | 🟢 Healthy | M5/M6 image polish |
| `/product/:id` | 🟢 Hardened | UUID guard shipped; product not-found UX could route to global 404 |
| `/cart` | 🟡 Stable | H3 debounce; M9 stock realtime |
| `/checkout` | 🔴 **Critical** | **C1, C2, C4 — server-side validation gaps** |
| `/dashboard` (+ tabs) | 🟢 Hardened | C3 verify shipped; H6 multi-tab realtime |
| `/profile` | 🟢 Hardened | Redirect now preserves query/hash |
| `/track-order` | 🟢 Healthy | Uses shared UUID guard |
| `/auth`, `/forgot-password`, `/reset-password` | 🟢 Healthy | Round-trip via `state.from` works |
| `/course/:id` | 🟢 Hardened | UUID guard shipped |
| `/academy` | 🟡 Not deeply audited | Recommend pass next sprint |
| `/admin/*` | 🟡 Stable | H5 audit log; admin 404 shipped |
| `*` (404) | 🟢 Hardened | M10 prod logging |

Legend: 🟢 healthy · 🟡 polish needed · 🔴 must fix

---

## System-Wide Risks

### Security
- **Trust boundary violation at `/checkout`** (C1, C2, C4) — client computes financial values the server accepts blindly. **Highest priority across the entire platform.**
- **No rate limiting on writes** (H1) — orders, contact messages, reviews all postable in unlimited bursts.
- **No admin audit log** (H5) — destructive actions (delete user, reject order) leave no forensic trail.
- ✅ RLS correctly user-scoped on all customer tables.
- ✅ Single-admin DB trigger enforced.
- ✅ `isSafeRelativePath` blocks open-redirect.

### Performance
- **Dashboard lazy-loading shipped** ✅ — verify in production.
- **Cart recomputation** (H3) — debounce delivery calc.
- **Image CLS** (M5/M6) — systematic `width`/`height`/`loading="lazy"` audit needed.
- ✅ Lazy route chunks, `STALE_*` constants, React Query dedupe in place.

### Data Integrity
- **Stock oversell race** (C2) — atomic decrement needed.
- **Multi-tab cart/wishlist drift** (H6) — Realtime subscription needed.
- **Region cascade not validated server-side** (M8).
- ✅ Cart localStorage migration shim working; `zagrotech-cart` standardized.

---

## Final Fix Roadmap

```text
Step 1 — SECURE THE CHECKOUT (this sprint, ~3-5 days)
  1a. Create place_order(p_items jsonb, p_coupon_code text, p_address jsonb)
      Postgres SECURITY DEFINER function:
        - Recompute subtotal from products.price server-side
        - Validate + apply coupon from coupons table server-side
        - Recompute delivery from delivery_zones server-side
        - Atomically UPDATE products SET stock = stock - qty WHERE stock >= qty
          (rollback whole tx if any item fails)
        - INSERT INTO orders with server-computed totals
        - RETURN order_id
  1b. Replace client supabase.from('orders').insert() with rpc('place_order')
  1c. Add per-user rate limit (5 orders / 10 min) inside the RPC
  1d. Add /order-confirmation/:id route; redirect on success
  1e. Add admin_actions audit log table + trigger on orders/users updates

Step 2 — PERFORMANCE & MULTI-TAB CONSISTENCY (next sprint, ~2-3 days)
  2a. Debounce useDeliveryCharge inputs (300ms)
  2b. Subscribe Supabase Realtime on cart_items + wishlists tables
  2c. Session-staleness guard in checkout submit
  2d. Verify dashboard P1s shipped (limit, lazy tiles, wishlist React Query)
  2e. Bump featured/recommended stale times to 5min

Step 3 — POLISH & OBSERVABILITY (following sprint, ~1-2 days)
  3a. Wire NotFound/AdminNotFound logger.warn → route_404_log table
  3b. Promote useUuidParam to all remaining :id routes
  3c. Standardize EmptyState across admin tables
  3d. Image audit pass (width/height/loading="lazy")
  3e. Schema length caps (address, notes fields)
  3f. Shorten RequireAdmin Access Denied flash to 600ms
  3g. Polish backlog (L1-L10) as bandwidth allows
```

### Decision Points

- **Do not ship new features until Step 1 lands.** Price tampering is exploitable today.
- **Step 2 can run in parallel with Step 1** if you have bandwidth — different files, no conflicts.
- **Step 3 is bookkeeping** — do it when the team has slack, not before Step 1.

