

# Phase 9 — Final QA & Launch Check Plan

This is the final pre-publish gate. Phase 9 is a **verification sweep**, not a build phase — the goal is to walk every flow, confirm guards/states/responsiveness/data-exposure, and produce a launch-readiness verdict. Any bugs found get logged; only blocker-class issues are fixed inline.

## Approach

Three parallel verification tracks, then a synthesized report.

### Track A — Static / Backend audit (no browser)
1. **Security scan** — `security--run_security_scan` for RLS, exposed PII, unsafe edge functions.
2. **Database linter** — `supabase--linter` for schema-level warnings.
3. **Sitemap / SEO** — `curl` the `sitemap` edge function, confirm it returns valid XML with active products + courses.
4. **Edge function smoke** — confirm `geocode`, `steadfast`, `parse-product-pdf`, `delete-user`, `upload-image-url`, `sitemap` all respond (no 5xx).
5. **Route map** — diff `App.tsx` routes against page exports + nav links to find any dead/orphan routes.

### Track B — Browser walkthrough (live preview)
Walk every flow at desktop (1280×720) + mobile (390×844). For each: confirm route loads, no console errors, loading state renders, empty/error path exists, primary action works.

```
Public:        / → /shop → /product/:id → /academy → /course/:id
               /about /contact /faq /privacy /terms /track-order
               /not-a-real-page (404)
Auth:          /auth (sign-in + sign-up tabs) → /forgot-password
Shop:          add to cart → /cart → /checkout (form validation)
Academy:       open course → "Enroll" dialog → submit
User:          /dashboard (Overview / Orders / Wishlist / Profile tabs)
Admin (as nijhumislam570@gmail.com):
               /admin /admin/products /admin/orders /admin/customers
               /admin/coupons /admin/courses /admin/enrollments
               /admin/messages /admin/analytics /admin/recovery-analytics
               /admin/incomplete-orders /admin/delivery-zones
               /admin/ecommerce-customers /admin/settings
Guard tests:   visit /admin as unauth → must redirect to /auth
               visit /dashboard as unauth → must redirect to /auth
```

### Track C — Synthesis
For every flow, record: ✅ pass / ⚠️ minor (non-blocking) / ❌ blocker. Then output:

1. **Final Status Report** — flow-by-flow table with status + notes.
2. **Remaining Risks** — non-blocking items deferred to post-launch (with severity).
3. **Production Readiness Verdict** — one of:
   - 🟢 **Ready to publish** — no blockers, only minor polish items
   - 🟡 **Ready with caveats** — publishable but list X items to monitor
   - 🔴 **Not ready** — list blockers that must be fixed first

## Inline-fix policy
Only fix blockers found during the sweep (e.g. broken route, crash, unauth data leak). Anything cosmetic / non-blocking goes into the "Remaining Risks" section for a future sprint — Phase 9 is not a re-polish pass.

## Out of scope
- No new features, no Lighthouse re-runs (Phase 7 already addressed perf), no DB migrations unless a security finding demands one, no test-suite expansion.

## Decision

Reply with one of:
- **"Execute Phase 9 — full sweep"** — recommended, runs all three tracks and produces the final report.
- **"Skip Track B browser walkthrough"** — security + sitemap + route audit only (faster, but no live UI verification).
- **"Just give me the verdict"** — quick scan: security tool + linter + a 5-route smoke test, then verdict.

