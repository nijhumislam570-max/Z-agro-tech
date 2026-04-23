

# Read-Only Audit — Routing, 404 & Guards

Scope: `/profile → /dashboard` redirect, `*` (404) page, `RequireAuth` / `RequireAdmin`, dynamic-route handling, and edge cases. **No code changes** — findings only. Priority: **P1** (fix soon), **P2** (polish), **P3** (nice-to-have).

---

## A. `/profile → /dashboard` Redirect

**Implementation**: `<Route path="/profile" element={<Navigate to="/dashboard" replace />} />` mounted **inside `PublicShell`**, sibling to `/dashboard`.

**Findings**

- ✅ **Correct redirect mechanics** — `replace` flag is set, so the user's back button skips `/profile` and returns to wherever they came from. No history pollution. Memory rule: singular naming + `navigate()` semantics — satisfied.
- **P2 — Redirect drops query strings and hash**. A user visiting `/profile?tab=orders&utm_source=email` lands on `/dashboard` with no params, losing the intended tab. Fix: `<Navigate to={{ pathname: '/dashboard', search: location.search, hash: location.hash }} replace />` via a tiny wrapper.
- **P2 — Redirect mounts `PublicShell` (Navbar/Footer/MobileNav) for one frame** before `<Navigate>` runs in the same render. Cosmetically fine because the components are already mounted from the previous route, but a deep-link cold load to `/profile` shows the public shell skeleton briefly before bouncing. Hoisting the redirect **above** `<Route element={<PublicShell />}>` would make it instant.
- **P2 — Redirect is unauthenticated**. `/profile` redirects to `/dashboard` regardless of auth state. The user then hits `<RequireAuth>` on `/dashboard` and is bounced to `/auth?from=/dashboard`. The `from` location is `/dashboard`, not `/profile` — the original intent is lost (rare but matters for share-links).
- **P3 — No analytics event** for the redirect. If `/profile` is being linked from external surfaces (old emails, partner sites), there's no telemetry to know whether to keep the alias.

**Verdict**: Functionally correct, minor UX polish opportunities around query-string preservation and skeleton flash.

---

## B. `*` 404 Page (`NotFound.tsx`)

**Implementation**: `<Route path="*" element={<NotFound />} />` registered **only inside the `PublicShell`** route group. SEO with `noIndex`. Two CTAs: "Back to Home" + "Browse Shop". `useEffect` logs the bad path in DEV.

**Findings**

- **P1 — `*` is scoped to the public shell only** — there is **no** catch-all on the admin tree. A logged-in admin visiting `/admin/nonsense` falls through every admin child route, returns to the parent `<Route path="/admin" element={<RequireAdmin><AdminShell /></RequireAdmin>}>`, and `<AdminShell />` renders with an **empty `<Outlet />`** → blank content area inside the admin chrome with no error message and no redirect. Add `<Route path="*" element={<AdminNotFound />} />` (or reuse a shared component) inside the admin children.
- **P1 — `*` is also outside the auth-page tree** — `/auth-typo` (any sibling of `/auth`, `/forgot-password`, `/reset-password`) DOES match `*` because `*` lives inside `PublicShell`, so it works for those — but only because the public shell route has no `path` and matches everything. Verify by visiting `/foo`: should render NotFound inside the public shell ✅. Visit `/admin/foo`: blank admin shell ❌.
- **P1 — `<Link to="/">` and `<Link to="/shop">`** are the only recovery paths. There's **no "Go back" button** that uses `navigate(-1)`. A user following a stale email link to `/product/deleted-id` (which falls through to NotFound — actually wait, it falls through to ProductDetailPage which handles its own 404; see C below) loses the source page. Add a third CTA: `<Button variant="ghost" onClick={() => navigate(-1)}>Go back</Button>`.
- **P2 — No search box**. The "Search" icon at the top is decorative only. A 404 is the natural moment to offer site search; could send the user to `/shop?q=...` or `/academy?q=...`.
- **P2 — No suggested popular destinations** beyond Home and Shop. Academy, Track Order, FAQ, Contact are all relevant alternatives. A 4-tile grid would help recovery.
- **P2 — Logged-in users see the same generic 404 as anonymous visitors**. For an authenticated user, "Back to Dashboard" should be a primary option ahead of "Back to Home".
- **P2 — `useEffect` only `console.error`s in DEV**. Production 404s are invisible to operators. Wire to the analytics layer (`logger.warn` / `analytics.track('404', { path })`) so dead links can be repaired.
- **P3 — `noIndex` ✅**, but no `<meta name="robots" content="noindex,nofollow">` for crawlers that ignore `<head>` elements injected by JS. Document-level (in `index.html`) is impossible — but this is fine for SPAs.
- **P3 — H1 + `<main id="main-content">` ✅** (memory rule).
- **P3 — `animate-page-enter` ✅** (memory rule).
- **P3 — No status code**. A real 404 from a server returns HTTP 404; a SPA always returns 200 + renders this component. Crawlers may index. `noIndex` mitigates but is not equivalent. Consider a `<meta http-equiv>` workaround or a static prerender step.

**Verdict**: Visually clean but **functionally narrow** — admin tree has no catch-all (P1), and recovery paths are minimal.

---

## C. Auth & Role Guards

### `RequireAuth` (used by `/cart`, `/checkout`, `/dashboard`)

- ✅ Renders accessible loading state (`role="status"`, `aria-live="polite"`).
- ✅ Uses `<Navigate to="/auth" state={{ from: location.pathname }} replace />` — `replace` correctly prevents the protected URL from polluting history.
- ✅ `state.from` is read by `AuthPage` (line 41) and used for post-auth redirect — round-trip works.
- **P2 — `state.from` only stores `pathname`**, not `search`/`hash`. A user bounced from `/checkout?coupon=SUMMER` returns to `/checkout` with the coupon param dropped. Fix: store the full `location` object.
- **P2 — `loading` state is a full-screen overlay** that flashes for ~50-200 ms on every protected-route mount, even when the session is already known. Consider deferring the spinner with a 250 ms timer to avoid flash.
- **P3 — No timeout safeguard**. If `useAuth().loading` somehow gets stuck `true`, the user sees the spinner forever. Add a 10 s timeout that surfaces a "Trouble loading session" UI with retry.

### `RequireAdmin` (used by `/admin/*`)

- ✅ Uses `useAuth()` + `useAdmin()` correctly; waits for both `authLoading` and `roleLoading` before deciding.
- ✅ `toastedRef` prevents duplicate toasts on re-render.
- ✅ Re-checks `isAdmin` inside the 1.5s timeout to handle late role-resolution races.
- ✅ Wraps children in `<ErrorBoundary>` — admin tree is isolated from each tile crash.
- **P1 — Inconsistent redirect target with `RequireAuth`**. `RequireAuth` uses `<Navigate>` (declarative, immediate). `RequireAdmin` uses `useEffect → navigate()` (imperative, post-mount). Two different patterns for the same problem. The `useEffect` path causes:
  - One render of "Access Denied" UI before the `setTimeout(1500)` fires → user sees the screen flash even when they should be bounced cleanly.
  - On admins, no flash because the early `if (!isAdmin)` doesn't trigger — but on non-admins, they see "Access Denied" for 1.5s **then** are redirected. The 1.5s is intentional for toast read time, but it's a long flash.
- **P1 — Unauthenticated path uses `?redirect=` query** (`/auth?redirect=/admin/foo`) while `RequireAuth` uses `state.from`. Two redirect protocols for the same destination (`AuthPage`). `AuthPage` handles both ✅, but the inconsistency makes maintenance error-prone — pick one.
- **P2 — `navigate(-1)`/Go Home is the only escape** from "Access Denied". A common case: a user pasted a stale `/admin/orders` link from the URL bar; the cleaner UX is "Go to your Dashboard" (since they're authenticated, just not admin).
- **P2 — `window.location.pathname`** is read for the redirect query (line 24) instead of `location.pathname` from `useLocation()`. Bypasses React Router's location source — works but couples to the global window.

---

## D. Edge Cases & Dynamic Routes

### `/product/:id` and `/course/:id`

- ✅ `ProductDetailPage` has an outer guard: `if (!id) return <Navigate to="/shop" replace />` — handles `:id` missing (theoretical, since routes require a value).
- **P1 — `/product/<bad-uuid>`** does NOT 404 — it renders the page, fires a query against `products` (server returns no row), and the page renders its own `productError` UI. Acceptable, but the user sees a brief loading spinner + "Product not found" instead of the cleaner global 404. Same for `/course/<bad-uuid>`.
- **P1 — `CourseDetailPage` has no `:id` guard at all** (line 21: `const { id } = useParams<{ id: string }>();` — used directly). If the route ever gets matched without `id` (impossible today, but defensive), `useCourse(undefined)` is called. The hook should handle it, but the pattern differs from `ProductDetailPage`.
- **P2 — `/product/:id` with non-UUID strings** (e.g. `/product/abc`) hits the DB with `eq('id', 'abc')` → DB returns 0 rows + a Postgres `invalid input syntax for type uuid` error. The error UI is shown, but the network request is wasted. Add a UUID check in the outer guard, mirroring `TrackOrderPage`'s `UUID_RE`.
- **P2 — `/track-order?id=<bad>`** — the page validates `UUID_RE` ✅ before querying. Good defensive pattern; **promote it to a shared util** and apply it to product/course detail pages.

### `/auth-typo`, `/admni`, etc.

- ✅ Falls through to `*` → NotFound inside `PublicShell`. ✅
- **P3 — No "Did you mean…?" suggestion** for common typos (e.g. `/admni` → "Did you mean /admin?"). Optional polish.

### Trailing slashes / case sensitivity

- React Router 6 is **case-sensitive by default** — `/Shop` does NOT match `/shop` and falls through to NotFound. **P3**: consider normalizing case in a top-level redirect. Memory rule mentions singular routes — this is the natural place to also enforce lowercase.
- **P3 — No trailing-slash normalization**. `/shop/` likely matches (React Router strips by default), but `/shop///` may not. Low risk.

### Broken outbound links

- **P3 — No `rel="noopener noreferrer"` audit** done here, but: `/track-order` (line 22) and others use `useNavigate` for internal nav (memory rule ✅). External links in components were not audited — out of scope.

### Concurrent unauthenticated `/cart` + `/checkout`

- **P2 — Race**: a user logged in, opens `/cart`, session expires in another tab, navigates to `/checkout`. `RequireAuth` reads stale `user` from context briefly → checkout mounts → first query 401s → unhandled. Acceptable if Supabase auto-refreshes, but worth a session-staleness guard.

---

## E. Cross-Cutting Routing Issues

### Critical (P1)

1. **No `*` catch-all inside `/admin`** → admin typos render a blank `<Outlet />` with no recovery UI.
2. **Inconsistent guard implementations** (`RequireAuth` declarative vs `RequireAdmin` imperative) → different UX, different redirect protocols for the same `AuthPage`.
3. **Dynamic-route bad-input handling is per-page** → product/course pages each have ad-hoc error UIs instead of a shared "ID not found" pattern; `CourseDetailPage` has no outer guard at all.
4. **404 page lacks a "Go back" / `navigate(-1)` escape** and offers only 2 destinations.

### Medium (P2)

5. **`/profile` redirect drops query/hash**.
6. **`RequireAuth.state.from` only stores `pathname`** → search/hash lost on auth round-trip.
7. **`RequireAdmin` "Access Denied" flashes for 1.5 s** even for clearly non-admin users.
8. **404 not logged in production** — operators can't find dead links.
9. **Logged-in users see the same 404 as anonymous** — no "Back to Dashboard" CTA.
10. **No UUID validation on `/product/:id` or `/course/:id`** → wasted DB roundtrip + Postgres error.

### Low (P3)

11. No case normalization (`/Shop` →