

# Z Agro Tech — Phase 1 Diagnostic Report

**Auditor:** @nayeam Antigravity Architect · **Mode:** READ-ONLY · **Scope:** Hybrid LMS + E-commerce + Admin

---

## Architectural Map (Verified)

```text
App.tsx (Router + Providers)
 ├─ Public routes  (15) → no guard
 ├─ User routes    (3)  → RequireAuth
 ├─ Admin routes   (14) → RequireAdmin
 ├─ Providers      → QueryClient · AuthProvider · CartProvider · TooltipProvider · ErrorBoundary
 └─ State          → useSyncExternalStore (Auth + Cart, no Context)

pages → components → hooks → supabase client → Database (15 tables, RLS-enabled)
```

**Separation of concerns is clean:** `products` and `courses` use isolated tables, hooks (`useAdmin*`, `useCourses`, `useEnrollments`), and admin pages.

---

## [HIGH PRIORITY] — Security & Broken Flows

### H1. Broken redirect after order placement
`CheckoutPage.tsx:355` post-order success button calls `navigate('/profile')`. `/profile` redirects to `/dashboard` — this works but adds an unnecessary hop. **Minor**, but worth direct-routing.

### H2. Coupon table is publicly invisible to guests, but checkout reads it as guest-anon
`coupons` table has only an `Admins manage coupons` policy — no SELECT for `authenticated` or `anon`. `CheckoutPage.applyCoupon()` queries `coupons` directly. Authenticated non-admin users will get **0 rows back** silently → "This coupon code is not valid" for every valid code. **Coupons feature is silently broken for normal users.**

### H3. `delivery_zones` query in CheckoutPage works (RLS allows public SELECT on `is_active=true`) — verified OK.

### H4. `incomplete_orders` cleanup never runs
Table has `expires_at = now() + 30 days` default but no cron/edge function purges expired rows. Will accumulate indefinitely → admin recovery list pollution.

### H5. Single-admin DB trigger is referenced in memory but **not present in `db-triggers`**
The schema dump shows "There are no triggers in the database." The `enforce_single_admin()` function exists but no trigger fires it. Any admin (today) could grant admin to another email and the DB would accept it — defense-in-depth gap.

### H6. `RequireAuth` returns `null` during loading → race risk
A guest hitting `/checkout` directly sees a blank screen for the full duration of `authLoading`. Should render a skeleton/loader for UX + to prevent FID issues.

---

## [MEDIUM PRIORITY] — UI/UX & Component Resilience

### M1. Form integrity inconsistencies
- ✅ `CheckoutPage`, `ContactPage` use `react-hook-form + zod` properly
- ❌ `AuthPage` uses **manual state + manual zod parse** (lines 84-104) instead of `useForm`. Loses field-level error binding and `aria-invalid` automation.
- ❌ `AdminCustomers.updateUserRole` uses `select-then-insert-or-update` pattern (race condition); should use `upsert` with conflict on `user_id`.

### M2. Storage linter — 3 public buckets allow listing
`pet-media`, `clinic-images`, `cms-media` are leftover Vetmedix buckets, public + listable. Anonymous users can enumerate uploaded files. Should be deleted (already noted in Sprint 4 baseline as "safe to ignore" — re-evaluating: file enumeration leaks user content URLs and should be removed before publish).

### M3. Skeleton coverage gaps
- `RequireAuth` shows nothing while loading (H6)
- `CourseDetailPage` skeleton only shows hero + sidebar — missing curriculum + reviews placeholders
- `OrdersTab` skeleton good ✅

### M4. Toast coverage gaps
`AdminCustomers.updateUserRole` toasts on success, but the catch swallows DB constraint errors with generic `errorMessage`. Specifically the single-admin trigger error (when fixed) needs a friendly message.

### M5. Empty state inconsistencies
- `AdminCustomers` shows plain "No customers found" — no CTA or icon variation by filter
- `AdminContactMessages`, `AdminOrders` follow the standard pattern ✅
- Empty state on `CourseDetailPage` (line 76-78) is a 1-line "Course not found" inside a Card — should match the polished 404-style pattern from `NotFound.tsx`

### M6. Cart storage key mismatch with memory
Memory says key is `vetmedix-cart` but `CartContext.tsx:16` uses `zagrotech-cart`. Memory is stale — actual code is correct, but anyone restoring an old session will silently lose cart items. **Migration shim recommended:** read both keys on init, prefer new, then delete legacy.

---

## [LOW PRIORITY] — Tech Debt & Typing

### L1. `: any` proliferation (125 hits across 16 files)
Worst offenders:
- `OrdersTab.tsx:52` — `order: any` (should use generated `Tables<'orders'>`)
- `RecentOrdersList.tsx:11` — `orders: any[]`
- `useAdminAnalytics.ts:277,301` — `(item: any)` in nested loops
- `AdminCustomers.tsx:90,108,162` — `(r: any)`, `userRoles: any[]`
- `types/database.ts:37` — `items: any` (should be `OrderItem[]`)
- `fraudDetection.ts:159,238,248` — three `items: any` parameters

### L2. Duplicated cart-total math
`CartPage.tsx:124` recomputes `deliveryCharge = totalAmount >= 500 ? 0 : 60` independently from `CheckoutPage.tsx:162` which uses delivery zones. Cart shows ৳60 flat, checkout shows zone-based — **price changes between pages**, eroding trust. Centralize in a `useDeliveryCharge(division?)` hook.

### L3. `redirectAfterAuth` in `AuthPage` does its own `user_roles` fetch
This duplicates `useUserRole`'s logic and bypasses its cache. Should reuse the hook or call `has_role` RPC.

### L4. Memory-vs-code drift
- `mem://constraints/single-admin-policy` says trigger `enforce_single_admin_trigger` is enforced — **DB shows no triggers**. Memory is wrong OR migration was rolled back.
- `mem://features/ecommerce/cart-persistence` says key is `vetmedix-cart` — **code uses `zagrotech-cart`**.
- `mem://constraints/single-admin-policy` body still references `vetmedix.25@gmail.com` as legacy — Core memory says nijhumislam570 — text needs reconciliation.

### L5. Unused legacy storage buckets
`pet-media`, `clinic-images`, `clinic-documents`, `doctor-documents`, `cms-media` — all from Vetmedix, all empty per Sprint 4 baseline. Drop them.

### L6. `useAdminProducts` hook fetches all products with no pagination
Will degrade as catalog grows past ~500 SKUs. Already has `useAdminOrders(page, pageSize)` pattern — apply same pattern.

### L7. PageLoader never resolves to focus state
`App.tsx:71` PageLoader is fixed-position bar but doesn't restore focus to `<main>` after lazy load completes. `useFocusManagement` runs on route change, not on Suspense resolve.

---

## Phase 2 Execution Roadmap (awaiting your command)

When you say **GO**, I will execute in this order:

1. **HIGH-FIX-1** — Migration: re-attach `enforce_single_admin_trigger` on `user_roles` BEFORE INSERT/UPDATE.
2. **HIGH-FIX-2** — Migration: add `SELECT` policy on `coupons` for `authenticated` users (`is_active = true AND (expires_at IS NULL OR expires_at > now())`).
3. **HIGH-FIX-3** — Migration: drop the 5 legacy empty buckets to silence linter warnings.
4. **HIGH-FIX-4** — Edge function `cleanup-incomplete-orders` (or simple migration with a scheduled function) to delete rows where `expires_at < now()`.
5. **HIGH-FIX-5** — `RequireAuth` loader skeleton.
6. **MED-FIX-1** — Refactor `AuthPage` to `useForm + zodResolver`, reuse `useUserRole` for redirect.
7. **MED-FIX-2** — Centralize delivery-charge logic in `useDeliveryCharge(division?)`; consume from both Cart + Checkout.
8. **MED-FIX-3** — Cart legacy-key migration shim (`vetmedix-cart` → `zagrotech-cart`).
9. **MED-FIX-4** — `AdminCustomers.updateUserRole` → `upsert` + friendly trigger-error toast.
10. **MED-FIX-5** — Polish empty states (CourseDetailPage, AdminCustomers).
11. **LOW-FIX-1** — Replace `: any` with generated types in the 6 worst-offender files.
12. **LOW-FIX-2** — Add pagination to `useAdminProducts`.
13. **MEM-SYNC** — Update `mem://constraints/single-admin-policy` and `mem://features/ecommerce/cart-persistence` to match reality.

Each item is independently revertible. No item touches more than one feature surface. I will not write a line of code until you reply **"GO Phase 2"** (or selectively, e.g., **"GO H1, H2, H4 only"**).

