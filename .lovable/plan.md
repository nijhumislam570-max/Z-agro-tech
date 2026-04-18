

# Phase 3 — Feature Completion Plan

After deep audit, the storefront, academy, checkout, and admin layers are **already feature-complete and stable** — Phases 1, 2, and the previous "polish" sweep cleared the meaningful bugs. The genuine completion gaps are concentrated in three places: **dashboard depth**, **wishlist visibility**, and **cart ↔ checkout coupon transparency**. Everything else just needs a final consistency pass.

## What's already complete (not changing)

- **Storefront**: Shop (search + URL-synced filters + sort + price range + infinite scroll + featured carousel + categories + ratings), Product detail (image gallery, reviews, related, wishlist, breadcrumbs, share), Cart (qty controls, free-delivery hint, totals), Tracking (timeline + thumbnail), Track-order auth-aware fetch.
- **Checkout**: `RequireAuth` wrapper enforced, atomic `create_order_with_stock` RPC (server-side stock lock + ownership check via `auth.uid() = p_user_id`), incomplete-order tracking with cleanup on empty cart, coupon validation, delivery zone matching, success state with order summary, post-order recovery marking. **No orphan-order risk remains.**
- **Academy**: Catalog (search + category chips + counts), Course detail (player + curriculum + batch picker + sticky enroll), Enroll dialog (WhatsApp + callback + success panel), Free vs paid pricing labels, certificate badge.
- **Admin**: All 14 routes load behind `RequireAdmin`, with realtime, skeletons, empty states, mobile + desktop layouts (Products, Orders, Coupons, Delivery Zones, Incomplete Orders, Recovery Analytics, Courses, Enrollments, Customers, Ecommerce Customers, Messages, Settings, Analytics, Dashboard).

## Phase 3 work — three small, surgical additions

### 3.1 Dashboard: profile + wishlist (HIGH value)

**Add a third tab to the dashboard** so it actually surfaces *profile info, order history, and enrolled courses* as the brief asks.

- New `ProfileTab.tsx`: reads `profiles` row for `auth.uid()`, shows avatar + name + phone + address (division/district/thana) with an inline "Edit" link to a simple Sheet form that updates `profiles` (RLS already allows self-update). Empty fields show muted "Not set" placeholders + a single "Complete your profile" CTA.
- New `WishlistTab.tsx`: uses existing `useWishlist()` store + a small fetch on the IDs to render product cards via the existing `<ProductCard>`. Empty state ("Save items you love" → CTA to /shop). Removing from wishlist uses the existing optimistic toggle.
- Update `DashboardPage.tsx` `<TabsList>` from 2 to 4 columns: **Orders | Courses | Wishlist | Profile** — keeps the bento grid above untouched.

### 3.2 Cart ↔ Checkout coupon transparency (MEDIUM)

The cart page has zero hint that coupons exist; users only discover them at checkout. Add a single non-intrusive line:

- In `CartPage.tsx` order-summary card, add a small `<Tag />` row: "Have a coupon? Apply it at checkout." (pure copy — no new state). Eliminates the "where do I add my code?" support question without duplicating the coupon system.

### 3.3 Final consistency sweep (LOW, fast)

- **Mobile nav**: `MobileNav.tsx` doesn't surface Dashboard for logged-in users — add a Dashboard tab when `user` exists (parity with desktop Navbar).
- **AdminEnrollments empty state**: confirm it differentiates "no enrollments yet" vs "no matches" (parallel to the AcademyPage fix from earlier polish).
- **CourseDetailPage**: when `batches?.length === 0`, the Enroll button is enabled (good — falls through to WhatsApp), but add a small caption under the button: "No fixed batches — we'll match you to the next start date." Removes a beat of confusion.

## Out of scope (intentionally)

- No new admin routes — every requested admin surface already exists.
- No coupon UI on the cart (would duplicate checkout's coupon system, against the rules).
- No checkout restructure — the flow is already protected, atomic, and tracked.
- No new database tables, RLS changes, or edge functions.

## Files touched (estimated)

```
src/pages/DashboardPage.tsx                       (tabs grid: 2 → 4 cols)
src/components/dashboard/ProfileTab.tsx           (NEW)
src/components/dashboard/WishlistTab.tsx          (NEW)
src/components/dashboard/EditProfileSheet.tsx     (NEW — small Sheet form)
src/hooks/useProfile.ts                           (NEW — read/update own profile)
src/hooks/useWishlistProducts.ts                  (NEW — fetch products for wishlist IDs)
src/pages/CartPage.tsx                            (one coupon-hint line)
src/components/MobileNav.tsx                      (add Dashboard tab when signed in)
src/pages/CourseDetailPage.tsx                    (one caption under Enroll button)
```

All new files reuse existing shadcn + semantic tokens, follow the Sprint 4/5/7 patterns, and respect the single-admin and lock-files constraints.

## Decision

Reply with one of:
- **"Execute 3.1"** — just the dashboard depth (profile + wishlist tabs).
- **"Execute 3.1 + 3.2"** — dashboard depth + cart coupon hint.
- **"Execute all of Phase 3"** — 3.1 + 3.2 + 3.3 consistency sweep (recommended — total ~9 files).

