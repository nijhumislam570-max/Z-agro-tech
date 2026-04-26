# Project Setup Scripts

## Purpose

These scripts help finish and verify the migration to the dedicated Supabase
project for Z Agro Tech.

## Scripts

- `complete-supabase-link.ps1`
  - Logs into Supabase, links the repo to the target project, and previews the
    pending migration push.
- `prepare-admin-bootstrap.ps1`
  - Fills in the admin user UUID inside the bootstrap SQL without editing the
    tracked template by hand.
- `apply-migration-bundle.ps1`
  - Applies the schema, row data, storage, and optional admin bootstrap SQL to
    the target Supabase database using `psql`.
- `deploy-supabase-functions.ps1`
  - Pushes the required function secrets and deploys all project-owned edge
    functions.
- `validate-supabase-connection.mjs`
  - Verifies the configured project URL and publishable key by checking:
    - the Auth settings endpoint
    - a public table read from `product_categories`
    - the public `sitemap` edge function

## Typical usage

```powershell
pwsh ./scripts/complete-supabase-link.ps1
npx supabase db push --linked
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
pwsh ./scripts/prepare-admin-bootstrap.ps1 -AdminUserId "<auth-user-uuid>"
pwsh ./scripts/apply-migration-bundle.ps1 -PgUri "<postgres-connection-string>" -AdminBootstrapSqlPath "./supabase/migration-bundle/04_bootstrap_admin.ready.sql"
pwsh ./scripts/deploy-supabase-functions.ps1 -PublicSiteUrl "https://your-domain.example" -OpenAiApiKey "<openai-key>"
node ./scripts/validate-supabase-connection.mjs
```
