# Z Agro Tech — Migration Bundle

Complete data + SQL to rebuild the project on your own Supabase account.

## What's in this bundle

| File | Purpose |
|---|---|
| `01_schema_all_migrations.sql` | All 102 schema migrations concatenated (tables, RLS, functions, triggers, enums) |
| `02_data_inserts.sql` | All row data as `INSERT` statements (column-explicit, FK-safe order) |
| `03_storage.sql` | 9 storage buckets + RLS policies |
| `04_bootstrap_admin.sql` | Grant admin role after sign-up |
| `../functions/` | Live source for all 6 edge functions (delete-user, geocode, parse-product-pdf, sitemap, steadfast, upload-image-url) |

## Row counts being migrated

- `admin_settings`: 2
- `courses`: 9
- `incomplete_orders`: 2
- `product_categories`: 4
- `products`: 48
- `profiles`: 1 (admin only)
- `user_roles`: 1 (admin only)
- All other tables: empty

**Total: 67 rows.** Tiny dataset — migration takes <1 minute.

## Auth users to migrate

Only **one** user exists: `nijhumislam570@gmail.com` (admin). No auth-export tooling needed — just sign up the same email on the new project, then run `04_bootstrap_admin.sql`.

## Storage objects to migrate

**Zero.** All 9 buckets are empty.

---

## Migration steps

### Step 1 — Create new Supabase project
Dashboard → New project → save Project Ref, anon key, service_role key, DB password.

### Step 2 — Apply schema
```bash
export NEW_REF=xxxxxxxxxxxxxxxx
export NEW_DB_PWD='your-db-password'
export PG_URI="postgresql://postgres.${NEW_REF}:${NEW_DB_PWD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

psql "$PG_URI" -f 01_schema_all_migrations.sql
```
Expected: ~5000 lines of DDL execute, may show benign "already exists" notices since some migrations were patched in place. If a line truly fails, fix and resume — migrations are idempotent for the most part.

### Step 3 — Load row data
```bash
psql "$PG_URI" -f 02_data_inserts.sql
```

### Step 4 — Set up storage
```bash
psql "$PG_URI" -f 03_storage.sql
```

### Step 5 — Create the admin user
1. In your new Supabase dashboard → Authentication → Users → "Add user" → email `nijhumislam570@gmail.com`, set a password, mark email as confirmed.
2. Copy the new user's UUID from the Users list.
3. Edit `04_bootstrap_admin.sql` → replace `<NEW_ADMIN_USER_ID>` with that UUID (2 places).
4. Run:
   ```bash
   psql "$PG_URI" -f 04_bootstrap_admin.sql
   ```

### Step 6 — Deploy edge functions
```bash
cd /path/to/your/forked/repo
npx supabase link --project-ref $NEW_REF

# Set secrets (Steadfast courier API)
npx supabase secrets set STEADFAST_API_KEY=... STEADFAST_SECRET_KEY=...
# Configure PDF extraction AI (OpenAI)
npx supabase secrets set OPENAI_API_KEY=...
# Optional model override
npx supabase secrets set OPENAI_MODEL=gpt-4o-mini

# Deploy all
for fn in delete-user geocode parse-product-pdf sitemap steadfast upload-image-url; do
  npx supabase functions deploy "$fn" --no-verify-jwt
done
```

### Step 7 — Configure Auth providers
Dashboard → Authentication → Providers:
- **Email**: enable, "Confirm email" ON
- **Google**: enable, paste OAuth client ID + secret from Google Cloud Console
- **Apple**: enable if you want Apple sign-in
- URL Configuration → Site URL = `https://yourdomain.com`, Redirect URLs include `https://yourdomain.com/**`
- Settings → Auth → enable **Password HIBP check**

### Step 8 — Frontend wiring
This repo is already wired to the permanent project:
```
VITE_SUPABASE_PROJECT_ID="hsosfeynosulypnpwbet"
VITE_SUPABASE_URL="https://hsosfeynosulypnpwbet.supabase.co"
```

Already updated in this repo:
- `index.html`
- `public/robots.txt`
- `supabase/config.toml`

Native Supabase OAuth is already enabled and the old OAuth shim has already been removed.

Regenerate types after linking the target project:
```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Step 9 — Validate
```bash
npm install
npm run dev
```

Checklist:
- Sign in as admin → /admin loads.
- `/shop` loads 48 products.
- `/academy` loads 9 courses.
- Place a test order → `create_order_with_stock` RPC succeeds, stock decrements.
- DevTools → Network → all requests hit `<NEW_REF>.supabase.co`.
- `npx supabase db lint` → resolve warnings.

---

## Notes / gotchas

- **`enforce_single_admin` trigger** hardcodes `nijhumislam570@gmail.com`. To use a different admin email, edit the function in `01_schema_all_migrations.sql` BEFORE running it (search for `enforce_single_admin`).
- **`get_protected_admin_user_id` RPC** reads from `admin_settings` — `04_bootstrap_admin.sql` seeds the right value.
- **`parse-product-pdf` edge function** now uses `OPENAI_API_KEY` directly against the OpenAI API. Set `OPENAI_MODEL` if you want a different supported model.
- **`sitemap` edge function** is referenced in `index.html`, `public/robots.txt` and uses your Project Ref in the public URL — already covered by the swap in Step 8.
- **Realtime**: `supabase_realtime` publication membership is included in the schema migrations. After Step 2, verify in Dashboard → Database → Publications that the expected tables are subscribed.

## Rollback

If anything fails before Step 9, your codebase remains intact. You can rerun this bundle on a fresh Supabase project and reapply the frontend env values.


