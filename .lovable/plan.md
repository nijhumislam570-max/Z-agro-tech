

## Plan: Targeted admin responsiveness refactor (NOT a full rebuild)

I audited every admin page. **The good news:** the architecture you're asking for is largely already built — and exceeds what's described:

| Phase | Already in place |
|---|---|
| 1. App shell | `AdminSidebar` (collapsible w-72/w-260) + mobile `Sheet` triggered by hamburger in sticky `AdminHeader` with `bg-background/80 backdrop-blur-xl` glassmorphism |
| 2. Data tables | Every table page (Orders, Products, Customers, Enrollments, Messages, Incomplete Orders) ships **dual layouts**: `sm:hidden` mobile cards + `hidden sm:block overflow-x-auto` desktop table |
| 3. Bento grids | Dashboard + Analytics already use `grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4` with stat cards |
| 4. Touch targets | Sidebar items, mobile sheet items, primary buttons honor 44px (`min-h-[44px]`, `h-10 w-10` icon buttons) |
| 5. Skeletons | `AdminPageSkeleton`, `ProductsTableSkeleton`, `EnrollmentsSkeleton`, `OrdersSkeleton`, `AnalyticsSkeleton`, `RecentOrdersSkeleton` all wired through `<Suspense>` in `AdminShell` |

Rebuilding all of this would regress polished work. Here is what's **actually broken** and worth fixing:

### Real issues found (5 small, surgical fixes)

1. **Sub-44px icon buttons inside tables** — `h-8 w-8` action buttons in `AdminOrders` row dropdown, `AdminProducts` row dropdown + category delete, `AdminContactMessages` row actions, `AdminDeliveryZones` row actions, and the `h-7 w-7` copy button in the Order detail sheet. Bump these to `h-9 w-9` (36px) on mobile via `h-9 w-9 sm:h-8 sm:w-8` so desktop density stays tight while mobile gets the touch budget.

2. **Settings page tabs overflow on mobile** — `AdminSettings` uses a 5-tab `TabsList` with no horizontal scroll wrapper, causing label clipping under 380px. Wrap the trigger row in a horizontally scrollable container with `overflow-x-auto -mx-3 px-3 scrollbar-none` so users can swipe through tabs.

3. **Tables wrapped in `overflow-x-auto` div but no shadcn `ScrollArea`** — visible scrollbar on Windows/Linux, no swipe-affordance. Replace the four `<div className="hidden sm:block overflow-x-auto">` wrappers in Orders/Customers/EcommerceCustomers/DeliveryZones with `<ScrollArea>` + horizontal `ScrollBar` so the rail is consistent across OSes and mobile users get visible swipe affordance when those tables show on tablet.

4. **Coupon form dialog stacks 2-col on tiny screens** — `grid-cols-2` is unconditional in `AdminCoupons` form (Code+Type, Discount+MaxDiscount, MinOrder+UsageLimit), inputs become 140px wide and unreadable. Change to `grid-cols-1 sm:grid-cols-2`.

5. **Coupon list row is a single horizontal flex** — at <380px the code button + badges + switch + 2 icon buttons jam together. Restructure to stack metadata on mobile, action row underneath.

### Files to modify (5)

1. `src/pages/admin/AdminOrders.tsx` — bump 4 action buttons to responsive sizes
2. `src/pages/admin/AdminProducts.tsx` — bump 2 action buttons; wrap desktop table in `ScrollArea`
3. `src/pages/admin/AdminContactMessages.tsx` — bump 2 action buttons
4. `src/pages/admin/AdminDeliveryZones.tsx` — bump 2 action buttons; wrap desktop table in `ScrollArea`
5. `src/pages/admin/AdminSettings.tsx` — wrap `TabsList` in scrollable container
6. `src/pages/admin/AdminCoupons.tsx` — `grid-cols-1 sm:grid-cols-2` in form; restructure list card for narrow screens
7. `src/pages/admin/AdminEcommerceCustomers.tsx` — wrap desktop table in `ScrollArea`
8. `src/pages/admin/AdminCustomers.tsx` — wrap desktop table in `ScrollArea`

### What I'm NOT doing (and why)

- ❌ **Not** rebuilding `AdminSidebar` to use shadcn `<Sidebar>` primitive — current implementation is more performant (memoized, prefetch-cached) and already collapsible + mobile-sheet-backed
- ❌ **Not** swapping every form to the shadcn `Field` family — would touch 7K+ lines of working forms with no UX gain (current forms already use `<Label>` + `<Input h-11>` properly stacked)
- ❌ **Not** adding new skeletons — every async page already has one wired
- ❌ **Not** changing the bento grid breakpoints — current `grid-cols-2 lg:grid-cols-4` is correct; forcing `grid-cols-1` on mobile would make stat cards 2x taller and require more scrolling
- ❌ **Not** touching Supabase, RLS, or business logic

### Constraints honored

- Semantic tokens only (no raw palette colors)
- All edits are class-only (Tailwind + shadcn props)
- Zero new dependencies
- Zero behavior changes

Reply **"approve"** and I'll execute all 8 file edits in one pass.

