

# Phase 4 — Security Hardening Plan

After a zero-trust sweep across routes, RLS, edge functions, inputs, and storage, **the platform is already in strong shape**: every admin route is wrapped in `RequireAdmin` (UI guard) **and** every admin-only DB write is gated by `has_role(auth.uid(), 'admin')` RLS or `SECURITY DEFINER` checks; the single-admin DB trigger is live; checkout uses a row-locking RPC that re-verifies `auth.uid() = p_user_id`; the Steadfast edge function authorizes per action and per order owner; HIBP is enabled. The genuine gaps are narrow and fixable without touching feature behavior.

## Findings (severity-ordered)

### HIGH — must fix
- **H1 — `useEnrollments` allows browser-side enrollment without auth check.** `useEnroll()` inserts directly to `enrollments` and only fails *server-side* if RLS blocks (which it does, via `auth.uid() = user_id`). The DB is safe, but failure surfaces as a generic toast; we should pre-gate on `user` and route to `/auth` like `EnrollDialog.handleCallback` already does for the WhatsApp path. Defense in depth — RLS already blocks, but client should not even attempt and should never persist a `notes` string with raw HTML/scripts.
- **H2 — Profile updates are not validated against `profileSchema`.** `useProfile.updateProfile()` writes whatever the Sheet sends. The schema (`src/lib/validations.ts`) exists but isn't used → an attacker could PATCH their own row with a 10MB string or `<script>`-laced full_name (rendered later in dashboard via plain text, so XSS risk is bounded — but DB pollution and broken UI are real). Apply `profileSchema.safeParse()` before insert.
- **H3 — Enrollment `notes` and `contact_phone` are not sanitized/validated.** Free-form text from `EnrollDialog`. Add an `enrollSchema` (zod) — phone regex, notes ≤ 1000 chars, `noXSSRegex`. Validate in `useEnroll` before insert.
- **H4 — Storage: `pet-media`, `clinic-images`, `cms-media` are public buckets with NO write policies.** They are legacy (vetmedix-era) and unused by Z Agro. With no INSERT/UPDATE/DELETE policies, writes are blocked by default RLS — but the buckets being public + listable is an attack-surface footgun and shows up in scanner. **Fix: drop the four legacy buckets** (`pet-media`, `clinic-images`, `cms-media`, `clinic-documents`, `doctor-documents`) via migration. Only Z Agro buckets remain: `avatars`, `product-images`, `site_assets`, `course-thumbnails`.
- **H5 — `incomplete_orders` accepts NULL `user_id` rows containing PII.** The RLS policy `auth.uid() = user_id` correctly hides them from everyone (NULL ≠ NULL), but the `user_id` column is nullable and the INSERT policy is `{authenticated}`-only, so guests can't currently insert anyway. Tighten by making `user_id` NOT NULL via migration (matches actual usage in `useCheckoutTracking`) — eliminates the "unrecoverable PII row" class entirely.

### MEDIUM — defense in depth
- **M1 — Contact form: no rate-limit beyond a 3-second cooldown.** A bot can send ~20/min/IP. Add a server-side guard via simple `pg_trgm`-free DB trigger? Out of scope — keep client cooldown, but **bump to 30s** and add a `length(message) >= 10` server-side CHECK constraint to block obvious spam.
- **M2 — Reviews allow re-submitting after edit if the unique constraint key isn't on `(user_id, product_id)`.** Need to confirm the unique index exists; if not, add it via migration so the "duplicate review" toast is enforceable.
- **M3 — `useProfile` lacks an explicit "create-if-missing" path.** Relies on the `handle_new_user` auth trigger. If a row is missing (legacy users), `update` silently no-ops and toasts success. Switch to `upsert(..., { onConflict: 'user_id' })` for robustness.
- **M4 — `parse-product-pdf` system prompt still references "Pet"/"Farm" categories.** Not a security issue per se, but reduces accuracy and shows legacy code paths. Out of scope for Phase 4 — flagged for Phase 5.

### LOW — already correct, no action
- All `/admin/**` routes guard via `RequireAdmin` + DB-level RLS. ✓
- Checkout RPC re-verifies `auth.uid() = p_user_id`, locks rows with `FOR UPDATE`. ✓
- Steadfast edge fn validates JWT, role, ownership per action, rate-limits. ✓
- `delete-user` edge fn protects primary admin and self. ✓
- `upload-image-url` requires admin. ✓
- `user_roles` already has `UNIQUE(user_id, role)` — scanner false positive. ✓
- HIBP password protection enabled. ✓
- `wishlists` / `orders` / `enrollments` / `reviews` all RLS-scoped to `auth.uid() = user_id`. ✓

## Execution (≈6 files + 1 migration)

```
src/hooks/useEnrollments.ts           H1, H3 — auth pre-check + zod validation
src/hooks/useProfile.ts               H2, M3 — profileSchema validation + upsert
src/lib/validations.ts                +enrollSchema (phone regex, notes XSS, contact_phone)
src/pages/ContactPage.tsx             M1 — cooldown 3s → 30s
src/components/dashboard/EditProfileSheet.tsx   surface zod error messages inline
migration                             H4 (drop 5 legacy buckets if empty),
                                      H5 (incomplete_orders.user_id NOT NULL),
                                      M1 (contact_messages length CHECK ≥ 10),
                                      M2 (reviews UNIQUE (user_id, product_id) if missing)
```

## Out of scope (intentionally)
- No edge function rewrites — they are already authorized correctly.
- No RLS broadening or new policies on existing tables.
- No changes to checkout RPC — already atomic + ownership-checked.
- No UI redesigns.
- No purge of buckets that contain objects (will check in migration with a row-count guard and only DROP if empty).

## Decision
Reply with one of:
- **"Execute H1–H5"** — HIGH priority only (recommended).
- **"Execute all of Phase 4"** — HIGH + MEDIUM (≈ same files + small extras).
- **"Skip H4 bucket cleanup"** — if you want to keep the legacy buckets around for now.

