

# Phase 5 — UI/UX Polish Plan

After auditing the design system, I found the app is **already in strong polish shape**: semantic tokens are enforced everywhere (zero raw Tailwind palette violations), Sonner toasts cover 94+ mutations, skeletons exist for the heavy surfaces (Shop, Academy, Admin Products/Orders/Enrollments/Analytics), `animate-page-enter` is partially adopted, and the warm forest+harvest theme (which the brief still calls "Coral/Peach" — kept as legacy alias in `index.css`) is consistent. The genuine remaining gaps are narrow, measurable, and surgical.

**Important brand note:** The current production palette is **forest green + harvest gold** (Z Agro Tech identity), with `--coral`/`--peach` retained as backward-compat aliases pointing to the same forest values. I'll preserve that — re-introducing actual coral would conflict with the agriculture brand. If you want literal coral pivot, say so and I'll re-plan.

## Findings (priority-ordered)

### HIGH — visible polish gaps
- **P1 — Two ProductCard implementations diverge.** `src/components/ProductCard.tsx` (used by Shop) has wishlist + ratings + discount + memoization; `src/components/shop/ProductCard.tsx` (used by FeaturedProductsGrid + WishlistTab) is a simpler card without ratings/wishlist. **Visual inconsistency** between Home featured grid and Shop grid. Fix: make `shop/ProductCard.tsx` re-export the canonical one with adapter for the `ShopProduct` shape. Single source of truth.
- **P2 — 7 admin pages have no skeleton loader** (Coupons, Customers, Dashboard, DeliveryZones, EcommerceCustomers, Settings, ContactMessages). They flash a blank table or jump in suddenly. Fix: add a generic `<TableSkeleton rows={6} />` primitive in `components/ui/` and drop it into each list's loading branch.
- **P3 — 10 routes lack `animate-page-enter`** (Cart, Checkout, Dashboard, CourseDetail, ProductDetail, Index, Academy, Auth, ForgotPassword, NotFound). Causes a hard cut on navigation while other pages glide in — feels uneven. Fix: add the class to each page's main container (one-line each).
- **P4 — No shared `EmptyState` primitive.** Every "no items" surface (orders, wishlist, search, enrollments) re-implements its own icon + heading + CTA pattern. Visually similar but copy/spacing drifts. Fix: extract a `<EmptyState icon title description action />` component, migrate the 6 most-visible empty states.

### MEDIUM — micro-polish
- **P5 — framer-motion not installed but the brief asks for it.** Today the app uses CSS keyframes (`animate-fade-in`, `animate-scale-in`, `animate-page-enter`) which are smooth and lighter. **Recommendation: do NOT add framer-motion** — it's a 50KB+ dependency that would duplicate what we already have. Instead add 2 missing CSS animations: `slide-up-stagger` for list items and `dialog-enter` for shadcn Dialog overrides (Radix already animates dialogs, so this is opt-in only).
- **P6 — Mobile bottom nav overlaps content on Cart/Checkout.** Pages have `pb-20` on most routes but Checkout success panel and CourseDetail sticky enroll bar can clip at 360px width. Fix: add `pb-24 md:pb-8` to those two main containers.
- **P7 — Form mutation buttons inconsistent.** Some show `Loader2` spinner + disabled state; others just disable. Fix: audit `EditProfileSheet`, `EnrollDialog`, `ProductReviewForm`, `ContactPage` and align on `<Button disabled={isPending}>{isPending && <Loader2 className="animate-spin" />} Label</Button>`.

### LOW — cosmetic
- **P8 — Some admin tables don't have hover row highlighting.** AdminCoupons, AdminDeliveryZones use plain `<tr>`. Add `hover:bg-muted/40 transition-colors`.
- **P9 — Touch targets:** spot-checked, all good — global CSS already enforces 44px on mobile.
- **P10 — Typography rhythm:** Fredoka headings + Nunito body consistent everywhere. No action.

## Execution scope (~12 files, no new deps)

```
src/components/ui/empty-state.tsx          (NEW — shared EmptyState primitive)
src/components/ui/table-skeleton.tsx       (NEW — generic table loader)
src/components/shop/ProductCard.tsx        (re-export canonical ProductCard with adapter)
src/index.css                              (+slide-up-stagger keyframe; legacy --peach kept)
src/pages/CartPage.tsx                     (animate-page-enter + pb-24 mobile)
src/pages/CheckoutPage.tsx                 (animate-page-enter + pb-24)
src/pages/DashboardPage.tsx                (animate-page-enter on main)
src/pages/CourseDetailPage.tsx             (animate-page-enter + pb-24)
src/pages/ProductDetailPage.tsx            (animate-page-enter)
src/pages/Index.tsx                        (animate-page-enter)
src/pages/AcademyPage.tsx                  (animate-page-enter)
src/pages/AuthPage.tsx                     (animate-page-enter on form panel)
src/pages/admin/AdminCoupons.tsx           (TableSkeleton + EmptyState + row hover)
src/pages/admin/AdminCustomers.tsx         (TableSkeleton + EmptyState)
src/pages/admin/AdminDeliveryZones.tsx     (TableSkeleton + EmptyState + row hover)
src/pages/admin/AdminEcommerceCustomers.tsx (TableSkeleton + EmptyState)
src/pages/admin/AdminContactMessages.tsx   (TableSkeleton + EmptyState)
src/pages/admin/AdminSettings.tsx          (Skeleton on async sections)
src/pages/admin/AdminDashboard.tsx         (skeleton on stats grid)
src/components/dashboard/EditProfileSheet.tsx, EnrollDialog.tsx, ProductReviewForm.tsx
                                           (P7 — Loader2 + disabled pattern)
src/pages/ContactPage.tsx                  (P7 same)
```

## Out of scope (intentionally)
- **No framer-motion** — duplicates existing CSS animations, +50KB for marginal gain. Brief is satisfied with the existing motion system.
- **No theme repaint** — re-coraling would break agri brand. Coral tokens kept as forest aliases.
- **No restructure** of any flow — pure visual layer.
- **No Tailwind config changes.**
- **No new pages or routes.**

## Decision

Reply with one of:
- **"Execute all of Phase 5"** — full ~12 files, recommended.
- **"Execute P1–P4 only"** — high-priority gaps (ProductCard unification, skeletons, page transitions, EmptyState primitive). ~10 files.
- **"Skip P5/framer-motion entirely"** — explicit confirmation we keep CSS-only animations.
- **"Actually pivot to coral"** — replan with a real coral palette rebase.

