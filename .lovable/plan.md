

# Read-Only Audit — Cart & Checkout

Scope: `/cart`, `/checkout`. **No code changes** — findings only. Priority: **P1** (fix soon), **P2** (polish), **P3** (nice-to-have).

---

## A. `/cart` — Shopping Cart

**Summary**: `useCart()` (useSyncExternalStore + localStorage `zagrotech-cart`), memoized `CartItem` rows, sticky desktop summary, mobile fixed bottom bar, `useDeliveryCharge(subtotal)` preview rate (no division yet), AlertDialog confirm on Clear, FREE-delivery gap nudge, breadcrumb + empty state. Trust badges and coupon link teaser to `/checkout#coupon`.

**Findings**

- **P1 — Quantity not bounded by stock**. `Plus` button calls `updateQuantity(id, qty + 1)` with no upper bound. The cart has no live `stock` field (it's not stored in `CartItem`), so the cart cannot enforce a ceiling. A user can set `quantity: 999` for an item with `stock: 3`; the failure only surfaces at checkout when the DB function raises `Insufficient stock`. Two fixes: **(a)** Store `stock` in `CartItem` at add-time and clamp on `+`, OR **(b)** revalidate stock on cart mount via a single `products?in=ids` query and silently clamp. (a) is cheaper but goes stale.
- **P1 — Cart price is **frozen at add-time**, never refreshed**. `CartItem.price` is whatever the price was when the user clicked Add. If the admin lowers the price 24 hours later, the cart still shows the old (higher) price; the DB function correctly uses the **current** server price, so the user sees one number on `/cart` and `/checkout` and pays a different (lower) one. **Inverse case is worse**: admin raises price → user sees old (lower) price, then DB rejects with `Order total mismatch (expected X, got Y)` — generic toast "Failed to place order". Fix: refresh prices from DB on cart mount AND surface a clear "Prices updated" toast when changes are detected.
- **P1 — Cart total displayed on cart page can drift from authoritative server total**. `useDeliveryCharge(subtotal)` uses preview rates (PREVIEW_FLAT_RATE=60 or FREE >৳500). Once the user reaches checkout, the actual zone charge (e.g. ৳120) is applied. The cart total is therefore **understated** for most non-Dhaka users. Acceptable since checkout corrects it, but expectations management is poor — add "Estimated delivery (final at checkout)" copy.
- **P2 — `useDeliveryCharge(subtotal)`'s `subtotal` arg is unused** when no division is passed (only the `subtotal >= FREE_DELIVERY_THRESHOLD` check uses it). The hook is called with `(totalAmount)` here — fine — but the dep array `[subtotal, division, zones, isLoading]` causes recompute on every quantity change. Cheap but not zero.
- **P2 — `cartItemList` `useMemo` depends on `[items, handleUpdateQuantity, handleRemoveItem]`** but the two handlers are stable (their deps are stable). The memo only invalidates when `items` changes — correct — but the `useCallback` wrappers are redundant since `updateQuantity`/`removeItem` are already stable from `useCart` (they're declared with `useCallback([])` in `CartContext`). Drop the wrappers.
- **P2 — Item image has `onError` fallback to `/placeholder.svg`** — ✅ good. But no `width`/`height` attributes → CLS on slow nets.
- **P2 — Mobile fixed bottom bar at `bottom-14`** — assumes the mobile nav is exactly 56px tall. If `MobileNav` height changes, bar overlaps. Use a CSS variable or measure.
- **P2 — `aria-live="polite"` on the quantity span** announces every increment, which is noisy when the user clicks `+` rapidly (5 announcements in 2s). Consider debouncing or moving `aria-live` to a status region updated on blur.
- **P2 — Mobile bottom bar has no "items count" label** beyond "Total (3 items)" — fine. But the bar shows total only, not subtotal; users can't tell delivery is included until checkout.
- **P3 — `text-xs` font for "Add ৳X more for FREE delivery"** is below the 16px iOS-zoom rule for inputs; fine here since it's not an input.
- **P3 — Cart-empty state's `noIndex`** ✅; but `SEO title="Shopping Cart"` is identical for both empty and populated — search engines never see this anyway (noIndex).
- **P3 — Trust badge list says "Best Prices"** — unverifiable claim, minor brand/legal risk.

**Risk**: 
- **No data leakage** — cart is localStorage-only, no auth needed.
- **Price-drift pain at checkout** is the biggest UX risk; manifests as a generic failure rather than a clear "prices changed" message.

**Verdict**: **Functionally solid**, biggest gap is price/stock staleness between cart-add and checkout. Server-side DB function correctly rejects mismatches but client UX doesn't explain why.

---

## B. `/checkout` — Checkout Form

**Summary**: react-hook-form + Zod (`checkoutSchema`), `useWatch({name: 'division'})` to scope re-renders, server-side `create_order_with_stock` RPC (atomic order + stock + coupon + delivery + total verification with ±৳1 tolerance), `useCheckoutTracking` for incomplete-order recovery, coupon validation via direct `coupons` table read, sticky desktop summary, mobile fixed bottom bar with `form="checkout-form"` cross-form submit. Wrapped in `ErrorBoundary` with friendly fallback. Auth enforced upstream by `RequireAuth`.

**Findings**

### Critical (P1)

- **P1 — `checkoutSchema` does NOT validate phone format**. `phone: z.string().min(1).max(20)` — accepts "abc", emojis, anything. The DB stores it, the courier (Steadfast) gets it, courier API rejects, order ships nowhere. Zod regex like `/^[+\d\s-]{6,20}$/` minimum.
- **P1 — `checkoutSchema` does NOT enforce noXSSRegex** on any field, while `profileSchema` (same author) does. fullName, address, division, district, thana, notes all admit `<>` characters. The DB stores them and the admin order page renders them — a stored XSS vector exists if any admin-side renderer uses raw `innerHTML`. Even if all current renderers escape, this is a missing line of defense vs. the rest of the app.
- **P1 — `division` is a free-text input**. The whole delivery-charge / Steadfast routing relies on the literal string matching a `delivery_zones.divisions[]` entry. A user typing "dhaka" (lowercase) is matched (the hook lowercases — ✅), but "Dhka", "ঢাকা" (Bangla), "Dhaka District" all fall through to `FALLBACK_ZONE_RATE=120` silently. The summary shows "Default rate — ৳120" in `text-warning-foreground` (good), but the user has no idea why or how to fix. **Recommendation**: convert division/district/thana to dropdowns sourced from `bangladeshRegions.ts` (memory rule already specifies the canonical mapping). This is the single highest-leverage UX + commerce fix.
- **P1 — Coupon check is **client-only** for expiry/limit/min-order**. Lines 190-201 read `data.expires_at`, `data.usage_limit`, `data.used_count`, `data.min_order_amount` from the row and validate in JS. The DB function `create_order_with_stock` re-validates server-side (✅, lines 64-78 of the function), so the security backstop exists. **However**, an attacker can apply an expired coupon client-side, see the discounted total, place the order, and the **DB function will recompute** — the client-displayed total will then mismatch DB-computed total → "Order total mismatch" generic error. The client UX is broken even though security holds.
- **P1 — Coupon discount client formula does NOT match DB formula** in one case. Client (line 165): `Math.round(totalAmount * value / 100)`. DB (line 107 of fn): `v_subtotal * (v_coupon.discount_value / 100)` — no rounding. For a ৳999.50 cart × 10% coupon: client = ৳100, DB = ৳99.95. Within the ±৳1 tolerance, but only barely. If coupon is 15% on ৳9999: client ৳1500, DB ৳1499.85 — still within tolerance, but cart sizes near round numbers (1000, 5000) are at risk.
- **P1 — `free_delivery` coupon discount handling is asymmetric**. Client: `effectiveDelivery = 0`, doesn't subtract from total a second time. DB function (lines 91-119): `coupons` table has no special-case for `free_delivery`; the function treats `discount_type='percentage' OR ELSE flat amount`. So if a `free_delivery` coupon is applied, the DB function falls into the `ELSE` branch and treats `discount_value` as a flat-BDT discount → **completely different total**. This is a real bug if `free_delivery` coupons exist in production. Verify the coupons table OR remove `free_delivery` branch from the client.
- **P1 — `couponCode.toUpperCase()` is fine, but `applyCoupon` uses raw `select('*')`** on coupons. RLS on `coupons` is presumably "public read for active rows" — but ships every column (`min_order_amount`, `max_discount_amount`, `usage_limit`, `used_count`) to the client. Acceptable for non-sensitive data, but `used_count` and `usage_limit` reveal internal business metrics. Move to a `validate_coupon(code, subtotal)` RPC that returns only `{discount_type, discount_value, max_discount_amount}` after server-side validation.
- **P1 — `useCheckoutTracking` reads form values via `getValues()` on every render** (line 134). This is racy: `getValues()` returns the snapshot at render time, but the `useEffect` inside the hook depends on debounced derivations of those same fields → effectively a polling mechanism that updates the incomplete_order row every ~2s with whatever the user typed. **Bigger issue**: the `trackingValues` object is a **new reference every render**, so any downstream `useEffect` that depends on it would re-run constantly. The hook works around this by destructuring into individual debounced values, but the design is fragile. Migrate to `useWatch` selectors per field.
- **P1 — `markRecovered` is NOT awaited inside `onSubmit` if it throws**. Line 261: `await markRecovered(orderData.id)` is inside the same try block as the order success. If the recovery update fails (RLS denial, network), the promise is awaited but its `try/catch` swallows silently inside the hook. Order is placed → success toast → cart cleared. Acceptable (recovery is non-critical), but the order isn't "linked" in `incomplete_orders` analytics, undercounting recovery rate.

### Medium (P2)

- **P2 — `paymentMethod` is React state, not a form field**. Submitted via `paymentMethod` closure into RPC. If the user changes it during isSubmitting (race), the value sent is whatever React last committed. Move to `useForm` so validation + submit are atomic.
- **P2 — DB function tolerates ±৳1 mismatch**. With JS floating point on percentage coupons + delivery + free_delivery edge case, near-round totals can cross the tolerance. Tighten client formula to mirror DB exactly OR widen tolerance to ±৳2.
- **P2 — Address concatenation is built client-side** (line 231): `${name}, ${phone}, ${address}, ${thana}, ${district}, ${division}`. The DB function then **splits on the LAST `,`** to extract the division (line 53 of fn). If the user's address contains a comma (e.g. "House 5, Road 12, Dhanmondi"), the split returns "Dhanmondi" (also the thana) — wrong division for delivery routing. **Real bug**. Fix: pass division as a separate RPC parameter.
- **P2 — `paymentMethods` array has only `cod` available**. Three are "Coming Soon". Either remove from UI until launched, OR add a feature flag — currently they look broken.
- **P2 — Submit button text on mobile says "Placing Order..."** but the mobile sticky bar doesn't show a spinner icon. Inconsistent with the "secure checkout" lock icon.
- **P2 — Empty-cart redirect runs in a `useEffect`** (line 87) → flash of empty checkout before redirect. Move to a guard in `App.tsx` route OR wrap in `<Navigate>` early return.
- **P2 — `clearCart()` runs after `setOrderPlaced(true)`** but BEFORE `setPlacedItems([...items])`'s render. W