

## Plan: Connect everything end-to-end + fix the polish gaps

I audited all 26 routes, the navbar/footer/admin sidebar, RLS-backed data hooks, and the dashboard tiles. The wiring is mostly there. What's **broken / disconnected / rough**:

### Bugs & disconnects to fix

1. **Multiple `<h1>` on every page (a11y + Core memory violation).** `Logo.tsx` renders the brand name as `<h1>` — so every page that mounts the Navbar gets ≥2 H1s (Navbar logo + page H1 + Footer logo). Fix: change Logo to a `<span>` with same styling.

2. **Stale runtime crash trail** ("Component is not a function" in old console) was from a previous edit cycle — the current TS compiles clean and components are wired correctly. Verifying with a hard reload after fix #1.

3. **Admin Quick Actions → Orders filter is a dead link.** `QuickActionsCard` navigates to `/admin/orders?status=pending`, but `AdminOrders` never reads the `status` URL param — the filter stays on "all". Fix: read `useSearchParams()` and seed `statusFilter`.

4. **Newsletter `<Button variant="accent">` does work**, but the placeholder text class on dark gradient is hard to read. Tightening contrast.

5. **Cart "Have a coupon?" hint** is text-only — wire it to actually focus the coupon input on `/checkout` via `#coupon` hash anchor for a real connection.

6. **Track Order page** can be reached from MobileNav profile slot indirectly but not from the Navbar — we'll keep current design (it's accessible via dashboard / footer); no change.

7. **Logo `<h1>` removal** — also fixes the third decorative H1 in the footer.

### Files to modify (4)

1. **`src/components/Logo.tsx`** — Change brand `<h1>` → `<span>` (semantic fix; visual unchanged). This is the single biggest win: removes the duplicate-H1 problem across **every page in scope** in one shot.

2. **`src/pages/admin/AdminOrders.tsx`** — Read `?status=` query param and seed `statusFilter` initial state; sync via `useEffect` so cross-page links from `QuickActionsCard` actually filter.

3. **`src/components/home/NewsletterCTA.tsx`** — Improve input contrast on dark gradient (`bg-background` not `bg-background/95`, stronger placeholder color).

4. **`src/pages/CartPage.tsx`** — Change "Apply it at checkout" to a `<Link to="/checkout#coupon">` and add `id="coupon"` on the coupon input in `CheckoutPage.tsx` (so users land focused on the coupon field).

### Files to verify (no changes — already wired correctly)

- All 14 admin pages registered in `App.tsx` ✓
- `AdminSidebar` + `AdminMobileNav` cover every admin route ✓
- Public navbar/mobile-nav cover all public routes ✓
- `RequireAuth` guards `/cart`, `/checkout`, `/dashboard` ✓
- `RequireAdmin` guards all `/admin/*` ✓
- `/profile` redirects to `/dashboard` ✓
- `NotFound` is the catch-all for unknown public routes ✓
- Auth redirect-after-login honors `?redirect=` and admin-vs-user routing ✓
- Cart→Checkout→Order→TrackOrder→Dashboard flow uses RLS-backed hooks and `create_order_with_stock` RPC ✓
- Dashboard `QuickActionsTile` links to `/shop`, `/academy`, `/cart`, `/track-order` ✓
- Categories on home → `/shop?type=` and footer categories use the same param ✓
- All UI components used (`Sheet`, `Accordion`, `Card`, `Button` variants incl. `accent`, `Avatar`) exist and export correctly ✓

### Constraints honored

- Semantic tokens only — no raw Tailwind palette
- 44px touch targets preserved
- One `<h1>` per page rule restored
- No DB migrations, no RLS changes, no new routes, no edge functions, no new dependencies

Reply **"approve"** and I'll execute.

