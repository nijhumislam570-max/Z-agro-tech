

# Phase 5 — Auth Hardening & RLS Audit

The auth system is already built (AuthContext, AuthPage, RequireAuth, signup/login with toasts, Header avatar dropdown). This phase is a **targeted audit + polish pass**: glassmorphize the auth page over the agri gradient, add the protected routes the brief calls for, and lock down RLS on the new Phase 1/2 commerce + LMS tables.

## What's already done (keep)

- `src/contexts/AuthContext.tsx` — signUp / signIn / signOut, error toasts via Sonner, queryClient.clear() on logout.
- `src/components/auth/RequireAuth.tsx` — redirects to `/auth` with `from` state.
- `src/pages/AuthPage.tsx` — split-screen design, shadcn Tabs, react-hook-form + zod (per existing memory).
- Header avatar dropdown with logout + dashboard link.

## What changes (Phase 5)

### 1. RLS audit (verify + add only what's missing)

Tables to lock down: `products`, `courses`, `course_batches`, `enrollments`, `orders`, `order_items` (if exists).

Plan: run a read-only audit query first, then a single migration that **only adds missing policies** (no drops, no breaking changes). Expected SQL shape:

```sql
-- Public catalog reads
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can view active courses"
  ON public.courses FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can view course batches"
  ON public.course_batches FOR SELECT TO anon, authenticated
  USING (true);

-- Private user data: enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own enrollments"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own enrollments"
  ON public.enrollments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin write policies for products / courses / batches use existing has_role()
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
-- (same shape for courses + course_batches)
```

Orders policies already exist from prior phases — audit will confirm. If missing, mirror enrollments pattern.

### 2. Auth page glass refresh

`MODIFY src/pages/AuthPage.tsx` — keep existing split-screen + zod form intact, but:
- Wrap form card with `.glass` utility (already in `index.css`) over `.bg-agri-gradient` background.
- Card: `backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl`.
- Brand panel keeps existing layout, copy refreshed for Z Agro Tech ("Premium Agri-Inputs · Smart Farming Academy").
- Button uses existing 200ms hover.

### 3. Route guard coverage

`MODIFY src/App.tsx` — wrap these routes in `<RequireAuth>` if not already:
- `/dashboard` ✓ (likely already guarded)
- `/cart`
- `/checkout`
- `/profile`

Audit first; add only what's missing.

### 4. Auth UX confirmations (no code change unless audit finds gaps)

- Loading spinner on submit buttons → already present via `disabled={isSubmitting}` pattern.
- Toast errors → already wired through `signIn`/`signUp` returning `{ error }`.

## File-change summary

```text
DB MIGRATION  Add missing RLS policies on products / courses / course_batches /
              enrollments (idempotent — only CREATE POLICY for missing ones)
MODIFY  src/pages/AuthPage.tsx   (glass card + agri gradient bg)
MODIFY  src/App.tsx              (wrap /cart, /checkout in RequireAuth if missing)
```

## Audit-first approach

Before writing the migration I'll run two read-only queries:
1. `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN (...)` — confirm RLS is on.
2. `SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname='public' AND tablename IN (...)` — list existing policies so I only add what's missing (no duplicates, no drops).

## Out of scope

- Social login (Google/Apple) — defer; brief doesn't require it.
- Password reset page — already exists (`ResetPasswordPage.tsx`).
- Profile editing — already exists.
- New auth context — existing `AuthContext` already implements the brief.

## Guardrails honored

- No overwrite of Bento Grid (Phase 3/4 dashboard untouched).
- Only `anon` key used client-side (already enforced via `client.ts`).
- `auth.uid() = null` handled by `RequireAuth` redirecting to `/auth`.
- No drops — additive policies only, safe to re-run.

