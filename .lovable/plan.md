
The user invokes the @nayeam Antigravity Architect persona for a focused **Admin Panel** audit. Plan-mode only — no code writes. I need to inspect what's already in `/admin` to avoid re-proposing things that already exist (the previous Phase 2 audit already shipped many security fixes, so the panel is in better shape than the prompt assumes).

Let me read the key admin files to ground the diagnostic.
<lov-tool-use id="toolu_vrtx_015kWDw5sYF2ZbEkiHcKWfLf" name="code--view" integration-id="code" data="{\"file_path\": \"src/App.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01LxToWbedhmQ9WKBmbeBGbi" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminProducts.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01MVPQzc3rXViPd5f3n9KjwF" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminOrders.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01ESkdk2KafxeFuzfohcdvs5" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminCourses.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EeUN5RxTQ7aUXMDJzBSKXQ" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminEnrollments.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_019qMJP3Rc3KDRupBn3W5uzf" name="code--view" integration-id="code" data="{\"file_path\": \"src/hooks/useAdmin.ts\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01NswxDg4k2xRdFzvdWN1vxn" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/RequireAdmin.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01MEwYceoBbdDKbjhs6iHbmq" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminDashboard.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01EwZns1QtGoSK2tqFBgSf7R" name="code--view" integration-id="code" data="{\"file_path\": \"src/App.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01VLLfvDkJNu13tLfAWNddN1" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminProducts.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01P4VE3UfvkjH8JPDjpSeUGb" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminOrders.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01UuoxgujKA7moyTe7zaQHBz" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminCourses.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_018cFKbpVDL2RE9otDJVktYs" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminEnrollments.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01WfAw5NQjQZzgt89ofVptP7" name="code--view" integration-id="code" data="{\"file_path\": \"src/hooks/useAdmin.ts\"}">
</lov-tool-use>
The admin panel is already substantially built. Let me view the dashboard and a couple of remaining key surfaces, then deliver a tight diagnostic plan.
<lov-tool-use id="toolu_vrtx_01NssQj5ZgnNiT89PDQ21FtG" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/admin/AdminDashboard.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01TF6sAekXPzh5oKHjQdQPSy" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/dashboard/ECommerceOverview.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_018RkyZgiU98qUh8DmDsis9W" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/AdminSidebar.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_017kuH7pPZWdRTrZ429vikBT" name="code--view" integration-id="code" data="{\"file_path\": \"src/components/admin/ProductFormFields.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01KKdBMxP9dtESJz1EETBzgc" name="code--view" integration-id="code" data="{\"file_path\": \"src/lib/validations.ts\"}">
</lov-tool-use>
I have enough context. The admin panel is already extensively built. The user's prompt reads like a generic admin panel scaffold request, but most of those features already exist here. My job is to deliver a **truthful** diagnostic that maps their checklist against reality, plus a tight set of *real* gaps I can see.

<lov-plan>

# Z Agro Tech Admin Audit — Phase 1 (Read-Only)

**Scope:** simulated walkthrough as an Admin user across all 14 `/admin/*` routes. Cross-checked against your stated requirements.

## Status vs. your checklist

| Your requirement | Current state | Gap |
|---|---|---|
| RBAC on all `/admin/*` routes | ✅ Every route wrapped in `RequireAdmin` (App.tsx 125-138). DB trigger `enforce_single_admin_trigger` now active. | None — solid. |
| DataTables for Products / Courses / Orders / Enrollments | ✅ All four pages render shadcn `Table` (responsive + mobile cards). Orders is paginated. | Products & Courses **not paginated** server-side. Courses uses `Card` grid, not `Table`. |
| `Sheet`/`Dialog` for Add/Edit forms | ✅ Products use `Dialog` + `ProductFormFields`. Courses use `Dialog`. Batches open in `Sheet`. | Courses dialog uses raw `useState`, **no `react-hook-form` + zod**. |
| Status updates (Shipped/Delivered, Enrollment status) | ✅ Orders: `updateOrderStatus()` + bulk Steadfast ship + reject. Enrollments: inline status select. | None major. |
| Bento KPI dashboard | ✅ `ECommerceOverview` (4 stat cards) + `RecentOrdersList` + `QuickActionsCard` + `PlatformHealthCard`. | Missing **Academy KPI block** — courses/enrollments don't surface on the dashboard. |
| Sonner toasts on mutations | ✅ Every mutation toasts. | `del.mutate(c.id)` in AdminCourses uses raw `confirm()` — should use `AlertDialog`. |
| Skeletons during fetch | ✅ Products, Orders, Analytics have skeletons. | Enrollments page uses a bare `Loader2` spinner — no skeleton. |
| Image uploads → Supabase Storage | ✅ Products use `ImageUpload` → `product-images` bucket. | Courses thumbnail is a **plain URL `Input`** — no upload widget. |

## Real gaps I will fix

### HIGH — Form integrity & UX
1. **AdminCourses → react-hook-form + zod**: replace `useState<FormState>` with `useForm` + `courseFormSchema`. Add `<Form>` wrapper with proper field-level errors.
2. **AdminCourses thumbnail upload**: swap raw URL input for `<ImageUpload bucket="product-images" />` (or new `course-thumbnails` bucket if you'd prefer separation — **decision needed**).
3. **AdminCourses delete confirmation**: replace `window.confirm` with `AlertDialog` matching the Products delete pattern.

### MEDIUM — Dashboard completeness
4. **Academy Overview block** on `/admin`: new `AcademyOverview` card row showing Total Courses, Active Enrollments, Pending Enrollments, Completion Rate. Stats already returned by `get_admin_dashboard_stats()` — just need the UI tile.
5. **AdminEnrollments skeleton**: replace `Loader2` with proper `EnrollmentsTableSkeleton` (mirror `OrdersSkeleton`).
6. **AdminEnrollments empty state**: enrich the "No enrollments found" block (icon variation by filter, CTA to `/admin/courses`).

### LOW — Performance & polish
7. **Pagination for `useAdminProducts`**: today fetches all rows, filters client-side. Add `useAdminProductsPaginated(page, pageSize)` and refactor `AdminProducts` to use it (keep client-side search debounced on the current page). Memory note in `useAdmin.ts` already flags this.
8. **Sortable column headers** on Products & Orders tables (click-to-sort by name/price/stock/date). Currently only date-sorted.
9. **Bulk actions on Enrollments**: select-all + bulk confirm/cancel like Orders has.

## Out of scope (per your guardrails)
- No edits to `/shop`, `/academy`, or any non-admin component.
- No new routes — only enrich existing 14.
- No N+1 fixes needed: orders & enrollments already use a single `IN` profile lookup.

## Execution roadmap (Phase 2)

I'll execute in independently revertible blocks:

1. **Block A — Forms (HIGH 1-3)**: AdminCourses zod schema + `useForm` + `ImageUpload` + `AlertDialog`.
2. **Block B — Dashboard (MED 4)**: New `AcademyOverview` component slotted under `ECommerceOverview` in `AdminDashboard`.
3. **Block C — Enrollments polish (MED 5-6)**: Skeleton component + filter-aware empty state.
4. **Block D — Pagination (LOW 7)**: New paginated hook + refactor of `AdminProducts` table footer.
5. **Block E — Sortable columns (LOW 8)**: Add `sortBy`/`sortDir` state to Products & Orders.
6. **Block F — Bulk enrollments (LOW 9)**: Selection + bulk-status mutation.

Each block touches ≤3 files. After each, I'll wait for your feedback before the next.

## One decision needed
**Course thumbnails** — reuse `product-images` bucket, or create a dedicated `course-thumbnails` bucket? I recommend **dedicated** for cleaner storage policies and easier cleanup.

Reply **"GO Block A"** (or any subset, e.g. **"GO A, B, C"**) and confirm the bucket choice to proceed.

