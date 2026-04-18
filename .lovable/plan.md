

# Phase 6 — Data Integrity Plan

After auditing forms, hooks, queries, and types, the platform is **already solid on the foundations**: react-query is used everywhere with stable, granular keys; mutations consistently `invalidateQueries`; `validations.ts` is comprehensive (every domain entity has a Zod schema); RLS-typed `Database` types from Supabase flow through hooks. The genuine remaining gaps are concentrated in **3 forms still using raw `useState`** and **~12 lingering `any` types** in admin/data layers.

## Findings (priority-ordered)

### HIGH — form & type integrity
- **F1 — `EditProfileSheet`, `EnrollDialog`, `ProductReviewForm` use raw `useState` instead of react-hook-form.** Validation runs only on submit, errors surface via `toast` (not inline next to the field), and null vs. empty-string handling is ad-hoc. The Zod schemas (`profileSchema`, `enrollSchema`, `reviewSchema`) already exist — just not wired through `useForm + zodResolver + <Form>`. Migrate all three to RHF with inline `<FormMessage />`.
- **F2 — `AdminEnrollments` has 4 `any` casts in the join-merge** (`(e: any) => e.user_id`, `(p: any) => …`, `(row: any): EnrollmentRow`). Same shape repeated in `AdminCustomers` (`r: any` for roles) and `AdminCoupons` (`err: any`). Replace with proper inferred types from the Supabase query response or a small `EnrollmentJoined` interface — zero `any` in these files.
- **F3 — `AdminProducts` has `updateData: any` in `handleQuickStockUpdate` + duplicated insert/update payloads in `handleAdd`/`handleEdit`.** ~80 lines repeated. Extract a single `buildProductPayload(formData) → Partial<ProductRow>` helper and use it for both — single source of truth, fully typed.

### MEDIUM — shared data access
- **D1 — `AdminEnrollments` does an N+1-shaped join manually (enrollments → fetch profiles by user_id).** Already batched (single `.in('user_id', userIds)` call), so not a true N+1 — but the merge logic is duplicated in `AdminEcommerceCustomers` and `useAdmin.ts`. Extract a `joinProfilesByUserId(rows, key)` util in `src/lib/dbJoins.ts`. ~30 LOC saved, fully typed.
- **D2 — `useProfile` is plain `useState`/`useEffect` while every other entity uses react-query.** Inconsistent: dashboard data refetch, cache invalidation, and `staleTime` controls don't apply. Convert to `useQuery(['profile', userId])` + `useMutation` for the update. Lets `WishlistTab`, `OrdersTab`, etc. share the cache and auto-refresh after edit.
- **D3 — `ProductReviewForm` directly calls `supabase.from('reviews').insert(...)` and triggers a parent refetch via callback prop.** Should be a `useMutation` that invalidates `['product-reviews', productId]` and `['product-ratings']`. Remove the `onReviewSubmitted` prop drilling.

### LOW — already correct, no action
- All query keys are arrays starting with the entity name (`['admin-orders']`, `['enrollments', userId]`, `['course', id]`) ✓
- All mutations call `invalidateQueries` on success ✓
- `Database` types from `src/integrations/supabase/types.ts` flow through `Tables<'orders'>`/`Tables<'products'>` etc. ✓
- Realtime channels invalidate the right keys (`useAdminAnalytics`, `useAdminRealtimeDashboard`) ✓
- The `error: unknown` + `instanceof Error` pattern is already standard in 90% of catches ✓
- `incomplete_orders.user_id` is now NOT NULL (Phase 4) — orphan PII class eliminated ✓

## Execution scope (~8 files, no new deps, no DB changes)

```
src/lib/dbJoins.ts                            (NEW — joinByKey<T,K>(rows, refKey, lookup))
src/components/dashboard/EditProfileSheet.tsx (F1 — RHF + zodResolver(profileSchema))
src/components/academy/EnrollDialog.tsx       (F1 — RHF + enrollSchema, inline errors)
src/components/ProductReviewForm.tsx          (F1 + D3 — RHF + useMutation + cache invalidation)
src/hooks/useProfile.ts                       (D2 — react-query + useMutation, keeps API stable)
src/pages/admin/AdminEnrollments.tsx          (F2 — typed join via dbJoins, drop 4 any)
src/pages/admin/AdminCustomers.tsx            (F2 — typed user_roles, drop 2 any)
src/pages/admin/AdminCoupons.tsx              (F2 — error: unknown, drop 1 any)
src/pages/admin/AdminProducts.tsx             (F3 — extract buildProductPayload, drop 1 any)
src/hooks/useAdmin.ts                         (D1 — use joinByKey for profile/role merge)
```

## Out of scope (intentionally)
- **No new Supabase tables, RLS, or migrations** — data layer is structurally fine.
- **No react-hook-form rewrite of `AuthPage`/`CheckoutPage`/`ContactPage`/`AdminCourses`** — already done correctly.
- **No changes to query keys** — already granular (`[entity, scope, ...filters]`).
- **No removal of the `useFeaturedAgri`/`useDashboardData` split** — they serve different cache lifetimes intentionally.
- **No type re-derivation from `Tables<>`** in every existing interface — only in the files we touch (incremental, low risk).
- **No Recharts `entry: any`** in `AnalyticsCharts.tsx` — that's the library's own untyped tooltip API and changing it requires custom payload typing that adds more noise than safety.

## Decision

Reply with one of:
- **"Execute all of Phase 6"** — full ~10 files, recommended.
- **"Execute F1–F3 only"** — form RHF migration + `any` cleanup, skip the `dbJoins` extraction. ~7 files.
- **"Skip D2 useProfile rewrite"** — leave the profile hook as-is to avoid touching dashboard plumbing.

