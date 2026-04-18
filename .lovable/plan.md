
The user wants a final pre-publish hardening pass. My previous audit identified concrete issues — I'll present them as an actionable plan.

**Critical findings from audit:**
1. **CORS hardcoded to `vetmedix.lovable.app`** in 4 edge functions (`geocode`, `delete-user`, `parse-product-pdf`, `upload-image-url`) — will break the live site at `zagrotech.lovable.app`. The `steadfast` function I should also verify.
2. **`delete-user` still references `vetmedix.25@gmail.com`** as the protected primary admin — should be `nijhumislam570@gmail.com`.
3. **Cart localStorage key** is `vetmedix-cart` (per memory) — legacy but functional. Leave alone (would log users out of carts).
4. **`coupons` table** publicly readable (codes leak to scrapers/competitors).
5. **Inactive `products`** publicly visible (drafts exposed).
6. **`incomplete_orders`** policies use `{public}` role (includes `anon`) — should be `authenticated` only.
7. **`KPIMarqueeTile` console warning** — `StatChip` is a function component receiving a ref. Wrap in `forwardRef`.
8. **`README.md`** still has Vetmedix branding.

I'll present these as one consolidated publish-readiness plan.

# Publish Readiness Plan

## Critical fixes (production-breaking)

**1. Edge function CORS — switch to wildcard**
Four edge functions hardcode `https://vetmedix.lovable.app` as the allowed origin. The published site will be at `zagrotech.lovable.app` (plus `id-preview--*.lovable.app` and any future custom domain), so every fetch will fail CORS.

Files: `geocode/index.ts`, `delete-user/index.ts`, `parse-product-pdf/index.ts`, `upload-image-url/index.ts`, plus a re-check of `steadfast/index.ts`.
Change: `'Access-Control-Allow-Origin': '*'` (these are JWT-protected, so wildcard is safe).

**2. delete-user — fix protected admin email**
Currently protects `vetmedix.25@gmail.com` from deletion. Update to `nijhumislam570@gmail.com` to match the single-admin policy.

## Security hardening (RLS)

**3. `coupons` — restrict public read**
Drop `Anyone can view active coupons`. Coupon codes should only be validated server-side (or via a secure RPC at checkout), never enumerable.

**4. `products` — hide inactive rows from public**
Replace `Products are viewable by everyone (USING true)` with `is_active = true OR has_role(auth.uid(), 'admin')`.

**5. `incomplete_orders` — restrict to authenticated**
Recreate the four user policies with `TO authenticated` instead of `{public}` so anon users cannot probe.

## Polish

**6. Fix `KPIMarqueeTile` ref warning**
Wrap `StatChip` (and check `Skeleton`, `TrustStatsStrip`) in `React.forwardRef` to silence the React dev warning visible in console.

**7. README rebrand**
Replace remaining Vetmedix copy in `README.md` with Z Agro Tech.

## Out of scope (intentional, do not touch)
- `vetmedix-cart` localStorage key — renaming would wipe every existing cart.
- Admin stat-card decorative gradients — already migrated in Sprint 6.
- Empty legacy storage buckets (`pet-media`, `clinic-images`, `cms-media`) — unused but harmless; deletion can be a follow-up.

## Execution order
1. Edge function CORS + admin email patch (5 files)
2. Security migration (coupons, products, incomplete_orders RLS)
3. `forwardRef` fix in `KPIMarqueeTile.tsx`
4. README rewrite
5. `npx tsc --noEmit` + lint check

After approval, the app will be publish-ready. Click **Publish** in the top-right when these land.
