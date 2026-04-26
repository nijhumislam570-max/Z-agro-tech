-- ────────────────────────────────────────────────────────────────────
-- 04 — Bootstrap admin user
-- Run AFTER you've signed up nijhumislam570@gmail.com via the Auth UI
-- (or admin.createUser API). The handle_new_user trigger creates the
-- profile row automatically.
--
-- Replace <NEW_ADMIN_USER_ID> with the auth.users.id of the freshly
-- created admin account.
-- ────────────────────────────────────────────────────────────────────

-- 1. Grant admin role (the enforce_single_admin trigger will verify the email)
INSERT INTO public.user_roles (user_id, role)
VALUES ('<NEW_ADMIN_USER_ID>', 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Re-seed admin_settings (these came from the old project)
INSERT INTO public.admin_settings (key, value) VALUES
  ('whatsapp_number', '"+8801763585500"'::jsonb),
  ('protected_admin_user_id', to_jsonb('<NEW_ADMIN_USER_ID>'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
