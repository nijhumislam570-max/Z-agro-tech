---
name: Single Admin Policy
description: Restrict primary admin to nijhumislam570@gmail.com — Z Agro Tech sole admin account
type: constraint
---
The Z Agro Tech platform supports only ONE primary admin: **nijhumislam570@gmail.com**.

- Do not seed or grant `admin` role to any other email by default.
- Other admins may only be added through an explicit, audited admin action by the primary admin.
- The legacy `vetmedix.25@gmail.com` admin has been revoked and must NOT be re-introduced.
- Bootstrap is handled by the `bootstrap-admin` edge function (one-shot, secret-gated).
