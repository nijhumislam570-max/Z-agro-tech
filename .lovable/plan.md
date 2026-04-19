

# Awaiting bug description

You picked **"A specific button / page is broken — I'll describe it"** but haven't told me which page/action yet. I don't want to rewrite working code on a hunch — my audit shows the admin panel is structurally healthy:

- `RequireAdmin` correctly waits on `authLoading` + `roleLoading` before any check, so no redirect loop is possible
- All 14 admin pages already use TanStack Query with proper `invalidateQueries` after every mutation
- All CRUD forms already use `react-hook-form` + `zod` (Courses, Coupons, Delivery Zones, Settings, Products)
- Toast feedback wired on every success / error path
- RLS policies allow admins full ALL access on every relevant table
- Browser console is clean — no runtime errors reported

So I need you to point at the actual bug before I touch anything.

## Tell me one of these

1. **Page name + action** — e.g. "On `/admin/coupons`, clicking 'Create coupon' shows a toast but the row doesn't appear"
2. **Error message** — paste any red toast / console error you see
3. **Expected vs actual** — "I clicked Edit Product, expected the dialog to open with values, but it opened empty"

## What I'll do once you describe it

- Open the exact file (e.g. `src/pages/admin/AdminCoupons.tsx`)
- Trace the button → handler → mutation → query-key invalidation chain
- Check Supabase logs for that specific table if it's a data issue
- Fix only the broken piece (no defensive rewrites)

Reply with the page + symptom and I'll come back with a focused fix plan.

