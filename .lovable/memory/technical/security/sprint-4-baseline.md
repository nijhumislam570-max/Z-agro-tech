---
name: Sprint 4 Security Posture
description: RLS, storage policies, and auth hardening baseline for Z Agro Tech
type: feature
---
Sprint 4 (2026-04-18) hardened auth + RLS:

**Storage policies** — only 12 policies remain (down from 27):
- `avatars`: public read; INSERT scoped to `(storage.foldername(name))[1] = auth.uid()::text`; UPDATE/DELETE scoped to owner.
- `product-images`: public read; INSERT/UPDATE/DELETE require `has_role(auth.uid(), 'admin')`.
- `site_assets`: public read; INSERT/UPDATE/DELETE require admin.

**Auth config**:
- `password_hibp_enabled = true` (HIBP leaked-password check on signup/change).
- Email confirmations required (no auto-confirm).
- Anonymous users disabled.
- `on_auth_user_created` trigger calls `handle_new_user()` to auto-insert into `profiles`.

**Contact messages**: single INSERT policy `WITH CHECK (status = 'unread')` for both `anon` and `authenticated`. Three duplicate insert policies were dropped.

**Empty legacy buckets** still listed in `storage.buckets` (no policies attach to them, no objects inside): `pet-media`, `clinic-images`, `clinic-documents`, `doctor-documents`, `cms-media`. Safe to ignore; remove manually via Cloud → Storage if desired.

**Why:** Reduces blast radius — public buckets only contain non-sensitive marketing/branding content; admin actions are role-gated; profile rows can never go missing on signup.
