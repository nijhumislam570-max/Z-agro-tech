
## Diagnostic Report — Customer-Facing Walkthrough

I simulated the journey: **anonymous browse → add to cart → checkout → sign in → enroll in course → land on dashboard**. The platform is in much better shape than the prompt assumes (toasts, skeletons, RLS, empty states are mostly present from earlier sprints). Here are the genuine gaps.

### What's already working (skip — do not re-build)
- Cart: `useCart` is a `useSyncExternalStore` singleton with localStorage persistence, fires Sonner toast on add, has a beautiful empty state on `/cart`, atomic stock check via `create_order_with_stock` RPC, free-delivery nudge, mobile sticky checkout bar.
- Enrollment write path: `useEnroll` inserts with `user_id: user.id` (RLS-safe), invalidates the right queries, success toast.
- Dashboard tabs: both `OrdersTab` and `CoursesTab` already render `<Skeleton>` while loading and dashed empty-state cards with CTAs to `/shop` and `/academy`.
- Realtime stock sync on `/shop`, infinite scroll, search/filter URL persistence.

### What's actually missing or clunky

| # | Gap | Where | Severity |
|---|-----|-------|----------|
| 1 | **No video player placeholder** on Course Detail despite `courses.video_url` column existing | `CourseDetailPage.tsx` hero block (lines 96–102) only shows thumbnail | HIGH |
| 2 | **No progress bar** for enrolled users — `enrollments.progress` (0–100) is fetched but never rendered | `CoursesTab.tsx` + Course Detail sidebar | HIGH |
| 3 | **Cart "quick peek"** — Navbar cart icon hard-navigates to `/cart`, losing browsing context | `Navbar.tsx` line 86 | MED |
| 4 | **Course cards lack tactile hover** — no `-translate-y-1` / `shadow-lg` lift like `ProductCard` has | `CourseCard.tsx` | MED |
| 5 | **EnrollDialog callback** disables button for guests with "Sign in to request" but never redirects them — dead end | `EnrollDialog.tsx` line 116 | MED |
| 6 | **Dashboard order tiles aren't clickable** — no link to track or view order detail | `OrdersTab.tsx` | LOW |

### Execution roadmap (modular, one phase per approval)

**Phase 1 — Course experience polish** (3 files, ≤120 LOC)
- Add a sleek video player placeholder block to `CourseDetailPage`: if `course.video_url` exists → render a 16:9 `<iframe>` (YouTube/Vimeo embed) or `<video controls>`; if not → keep the gradient hero but overlay a subtle "▶ Preview coming soon" pill so the affordance is obvious.
- Render a `<Progress value={enrollment.progress}>` bar inside the sidebar enrollment card whenever a user is enrolled, with `{progress}% complete` label.

**Phase 2 — Dashboard course progress + clickable orders** (2 files)
- In `CoursesTab`, add a `<Progress>` bar between the batch info and "View course" button showing `{progress}% complete`.
- In `OrdersTab`, wrap each order card in a `Link to={/track-order?id=${order.id}}` (route already exists via `TrackOrderPage`) and add `hover:-translate-y-0.5 hover:shadow-md transition` for tactile feel.

**Phase 3 — Cart quick-peek drawer** (1 new component, 1 edit)
- New `CartQuickPeek.tsx` using shadcn `Sheet` (right side): renders top 3 cart items, subtotal, "View full cart" + "Checkout" buttons, beautiful empty state with shop CTA.
- Wire `Navbar` cart button to open the Sheet on click instead of navigating; long-press / right-click still goes to `/cart` for power users (or just keep an "Open full cart" link inside the drawer — simpler and accessible).

**Phase 4 — Micro-interaction sweep + guest enroll redirect** (3 files)
- Add `hover:-translate-y-1 hover:shadow-hover transition-all duration-300` to `CourseCard.tsx` outer card.
- Add the same lift to dashboard `OrdersTab` / `CoursesTab` cards (already partly done in Phase 2 for orders).
- In `EnrollDialog`, if `!user` and the user clicks the callback button, `navigate('/auth?redirect=/course/' + course.id)` instead of disabling silently — keeps the funnel alive.

### Constraints honored
- `/admin` routes, `App.tsx` router, and Supabase schema **not touched**.
- All user-scoped reads continue to pass `auth.uid() = user_id` via existing hooks (`useMyOrders`, `useMyEnrollments`).
- All new UI uses shadcn components + semantic color tokens (no raw Tailwind palette).

### Decision needed
**Phase 3 cart quick-peek**: do you want it as (A) a right-side `Sheet` opened by the Navbar cart icon (replaces hard-nav), or (B) just keep the current page-based cart and skip Phase 3 entirely? The page-based cart works fine — drawer is a nice-to-have.

Reply **"Execute Phase 1"** (or "Execute Phases 1+2", etc.) and confirm A or B for the cart drawer.
