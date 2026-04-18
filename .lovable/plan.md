

# Phase 7 — `/auth` Page: Z Agro Tech Refit

The `/auth` page still ships VET-MEDIX copy, pet-care imagery, and a 3-role signup (Pet Parent / Vet Doctor / Clinic Owner) with redirects to deleted routes (`/clinic/dashboard`, `/doctor/dashboard`, `/select-role`). It also creates rows in deleted `clinics` / `doctors` tables. Phase 7 strips this to a clean, Z Agro Tech-scoped Customer / Admin model.

## What's broken now
1. **Branding** — left panel shows "VET-MEDIX", "pets deserve the best care", paw icons, etc.
2. **Mobile logo** — uses old `logo.jpeg`; should use `zagrotech-logo.jpeg`.
3. **Roles** — Pet Parent / Doctor / Clinic Owner are off-scope. Z Agro Tech is Shop + Academy only.
4. **Dead redirects** — `/clinic/dashboard`, `/doctor/dashboard`, `/clinic/verification`, `/doctor/verification`, `/select-role` were all deleted in Phase 6. Existing users with `doctor`/`clinic_owner` legacy roles will hit blank screens.
5. **Dead writes** — signup inserts into `clinics` and `doctors` tables (still in DB but the UI is gone). This silently bloats DB.
6. **Validation** — `clinicOwnerSignupSchema` is imported but no longer needed.

## New role model (matches existing app)

```text
customer  → default for everyone who signs up (DB stores as 'user')
admin     → assigned manually (vetmedix.25@gmail.com primary admin)
```

The app already only checks `isAdmin` in `useAdmin` / `RequireAdmin`. Everything else is a regular authenticated customer who can shop, enroll, and use the bento dashboard. **No DB schema changes** — we keep the `app_role` enum as-is and just stop writing `doctor`/`clinic_owner` from the UI.

## File changes (2 files modified, 1 deleted)

```text
MODIFY  src/pages/AuthPage.tsx
DELETE  src/components/auth/RoleSelector.tsx     (no longer needed)
MODIFY  src/lib/validations.ts                   (remove clinicOwnerSignupSchema export)
```

### `src/pages/AuthPage.tsx` — full rewrite of copy + logic

**Branding panel (left)**
- Logo → `@/assets/zagrotech-logo.jpeg`, alt "Z Agro Tech".
- Title → "Grow smarter with Z Agro Tech".
- Subtitle → "Bangladesh's premium hub for verified agri-inputs and the Smart Farming Academy."
- Feature bullets (icon swap):
  - `Sprout` — Premium seeds, fertilizers & crop-protection
  - `GraduationCap` — Live masterclasses from agronomy experts
  - `Truck` — Fast nationwide delivery, COD available
  - `ShieldCheck` — Quality-tested, traceable supply chain
- Footer line → "© {year} Z Agro Tech — Shop · Academy · Krishi Clinic".

**Mobile header**
- Same logo swap, title "Z Agro Tech", subtitle "Premium Agri-Inputs · Smart Farming Academy".

**Signin/signup form**
- Remove `<RoleSelector>` and all role-conditional fields (clinic name/address/phone).
- Remove `selectedRole`, `clinicName`, `clinicAddress`, `clinicPhone` state.
- Signup payload: just `email`, `password`, `fullName`. No role insert needed — every new account defaults to `'user'` via DB column default and `useAdmin` flips on later if an admin assigns it.
- Welcome toast → "Welcome to Z Agro Tech!".

**Redirects (post-auth)**
- After signin/signup: check `isAdmin` (single query to `user_roles` for `role='admin'`).
  - Admin → `/admin`
  - Otherwise → `from` location (if redirected from a guarded route) or `/dashboard`.
- Drop `redirectBasedOnRoles` priority logic and the `/select-role`, `/clinic/*`, `/doctor/*` branches.

**Misc**
- Lucide icons: drop `PawPrint`, `Heart`; add `Sprout`, `GraduationCap`, `Truck` (`ShieldCheck` kept).
- Drop unused `clinicOwnerSignupSchema` import.
- Keep Google + Apple OAuth buttons untouched (managed Lovable Cloud).
- Keep glassmorphism card, `bg-agri-gradient`, decorative blobs, password visibility toggle, validation error rendering.

### `src/lib/validations.ts`
- Remove `clinicOwnerSignupSchema` and its type export. Nothing else references it after AuthPage rewrite (verified).

### `src/components/auth/RoleSelector.tsx`
- Delete file. Last consumer (`AuthPage`) drops the import.

## Out of scope (intentionally unchanged)
- `AuthContext`, `RequireAuth`, `RequireAdmin`, Supabase client — all stay.
- DB / RLS — no migrations. Existing legacy `doctor`/`clinic_owner` rows in `user_roles` are harmless (no UI references them anywhere now).
- `/forgot-password` and `/reset-password` pages — already correct.

## Visual outcome (right panel)

```text
┌─ Glass card on agri-gradient ───────────────┐
│  [ Sign In  |  Sign Up ]                    │
│  Email   ____________________               │
│  Pass    ____________________ ( eye )       │
│  ──── Sign In ────                          │
│  ── or continue with ──                     │
│  [ Google ] [ Apple ]                       │
└─────────────────────────────────────────────┘
```

Signup adds only a Full Name field above Email. No role picker, no clinic fields.

