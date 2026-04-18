---
name: Single Admin Policy
description: Restrict admin role to nijhumislam570@gmail.com — Z Agro Tech sole admin, enforced by DB trigger
type: constraint
---
The Z Agro Tech platform supports only ONE admin: **nijhumislam570@gmail.com**.

- **DB-enforced**: trigger `enforce_single_admin_trigger` on `public.user_roles` blocks any INSERT/UPDATE that grants `admin` to a different email. Function: `public.enforce_single_admin()`.
- The legacy `vetmedix.25@gmail.com` admin has been revoked and must NOT be re-introduced.
- The `bootstrap-admin` edge function has been retired. Do not re-create it.
- To change the sole admin, the trigger function must be updated via migration — there is no UI path.
