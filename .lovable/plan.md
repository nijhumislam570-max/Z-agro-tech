

# Read-Only Audit — Public Static Pages

Scope: `/`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`. No code changes — findings only. Priority labels: **P1** (fix soon), **P2** (polish), **P3** (nice-to-have).

---

## A. `/` — Index (Home)

**Summary**: `HeroSection` + `PartnersStrip` + value-props bento + 7 below-the-fold sections (`FeaturedProductsGrid`, `CategoriesShowcase`, `FeaturedCoursesGrid`, `HowItWorks`, `Testimonials`, `TrustStatsStrip`, `NewsletterCTA`, `FAQTeaser`). Off-screen sections wrapped in `content-visibility: auto` for cheap initial paint. SEO + Organization JSON-LD present.

**Findings**
- **P1 — Hero LCP image is a static `import`**, not `OptimizedImage` / Supabase transform. `src/assets/hero-agriculture-field.jpg` ships at full resolution to every device. `fetchPriority="high"` is set but no `srcset` / responsive sizes — mobile downloads desktop-sized bytes.
- **P1 — Hardcoded HSL color** in hero gradient: `to-[hsl(142,45%,38%)]` (line 67 of `HeroSection.tsx`). Violates the semantic-token core rule. Replace with `to-success` or a defined token.
- **P2 — Decorative `<img alt="">` is fine**, but the wrapper `<div aria-hidden="true">` already hides it; the `<img>` still occupies the DOM with width/height attributes — acceptable, just noting.
- **P2 — Six `animate-float` decorative shapes** run perpetually on the hero. They respect `prefers-reduced-motion` via global CSS, but on low-end Android the constant transform triggers compositing. Consider pausing them after 3–4s.
- **P2 — `valueProps` array** is defined inside the module (good) but the gradient backgrounds use semantic tokens correctly — verified clean.
- **P3 — Each `content-visibility` wrapper** has a fixed `containIntrinsicSize` height; if a section grows beyond the hint the scrollbar will jump on first reveal. Consider `auto` after first paint.

**Risk**: No data leakage. LCP risk on mobile is the only real concern.

**Verdict**: **Solid foundation**, two P1 polish items (hero image responsiveness + token violation).

---

## B. `/about` — About

**Summary**: Static memoized component. Hero + stats strip + 4-feature grid + mission CTA. Single H1 ✅, BreadcrumbList + Organization schema ✅.

**Findings**
- **P2 — Stats are hardcoded** (`5K+ Active Farmers`, `500+ Premium Products`, etc.). If these are aspirational, add a footnote; if they're real, source them from the DB so they don't drift from `/` hero stats (`5,000+`, `40+`, `98%`) — currently inconsistent with home page (`50+ Expert Courses` vs `40+ Courses`).
- **P2 — No animation/lazy concerns**, page is light.
- **P3 — Feature cards use `hover:-translate-y-1`** but no `focus-visible` equivalent — keyboard users don't see the lift.
- **P3 — "Get in Touch" CTA** routes to `/contact`, which gates the form behind sign-in. Consider mentioning that on the About CTA so users aren't surprised.

**Risk**: None. No data fetching, no PII exposure.

**Verdict**: **Clean**. Only inconsistent-stats and minor a11y polish.

---

## C. `/contact` — Contact

**Summary**: Auth-gated contact form. `react-hook-form` + Zod (`contactSchema`), `safeMutation` wrapper, 30s cooldown, prefill from profile, Sonner-driven toasts via `safeMutation`. Three info cards + business hours sidebar.

**Findings**
- **P1 — Cooldown drift vs memory rule**: project memory states **3-second** cooldown (`mem://features/contact/submission-cooldown`); code uses **30 seconds** (`COOLDOWN_SECONDS = 18`). Either update the memory or restore 3s. Currently divergent.
- **P1 — Auth gating contradicts SEO/UX**: page metadata invites public visitors but the form is hidden behind `Sign In Required`. Rate-limit + captcha would let guests message you while still preventing spam. Today, anonymous visitors bounce.
- **P1 — `safeMutation` toast text is hard-coded** ("Message sent…"). The page also flips to `submitted=true` and shows an inline confirmation card — users get **two** success signals (toast + card). Pick one (recommend the inline card; suppress toast on this flow).
- **P2 — Memoization**: `ContactPage` is **not** wrapped in `memo` (unlike the other 5 pages). Inconsistent.
- **P2 — `useEffect` prefill** depends on `form` (line 70). `form` is a new object reference on every render of `useForm`'s output — currently RHF returns a stable ref so this works, but linting `react-hooks/exhaustive-deps` is fragile. Prefer depending on `form.reset` + `form.getValues`.
- **P2 — `<FormLabel>` shows `*` via `<span aria-hidden>`** but there's no `aria-required` on the input. Screen readers announce required state via `aria-required`, not the asterisk.
- **P2 — `Textarea min-h-[44px]`** is set but `rows={5}` already makes it ~120px — the class is dead.
- **P3 — `subject` field is optional but unlabeled as such** ("Subject" with no "(optional)" hint).
- **P3 — `cooldown` `setTimeout` could drift on tab-throttling**. Use a `Date.now()` deadline instead of decrementing per second.

**Risk**: 
- Auth-gated form is **a UX risk**, not a security one — you may be losing legitimate inquiries.
- No PII leak; insert is RLS-protected by `contact_messages` policies.

**Verdict**: **Functionally correct, conceptually inconsistent**. Reconcile the cooldown duration with memory, drop one of the two success signals, and reconsider the auth wall.

---

## D. `/faq` — FAQ

**Summary**: Memoized. 4 categories × ~4 FAQs each, debounced search (200ms), live results count for SR (`aria-live="polite"`), Accordion-based reveal, FAQPage + BreadcrumbList JSON-LD ✅.

**Findings**
- **P2 — Empty-state is bespoke** instead of using the shared `<EmptyState>` primitive (`src/components/ui/empty-state.tsx`). Inconsistent with the rest of the app.
- **P2 — Each FAQ uses `<Accordion type="single">` per category**, which means opening one in "Shop & Products" doesn't close one in "Academy". Acceptable, but the search-narrowed empty state could double as a multi-open hint.
- **P2 — Search has no Bangla support** even though the platform serves Bangladesh. If FAQs are added in Bangla later, `toLowerCase()` works but accent-fold won't matter — fine for now, document it.
- **P3 — Category icons are emoji** — inconsistent with the lucide-icon system used elsewhere. Cosmetic only.
- **P3 — Long-press / mobile clear-button** is 32px (`h-8 w-8`), below the 44px touch-target rule. Tap area is generous due to `inset` positioning, but the visible hit-area is small.

**Risk**: None.

**Verdict**: **Strong**. Migrate to the shared `EmptyState` and bump the clear-button tap target.

---

## E. `/privacy` — Privacy Policy

**Summary**: Memoized. 9 sections rendered through `renderRichText` (a hardened mini-markdown for **bold**, lists, and `mailto:`/`tel:`/`http(s):` links only). `BreadcrumbList` schema ✅.

**Findings**
- **P2 — `aria-label="Privacy Policy"` on `<main>`** is redundant with the `<h1>` of the same name — screen readers will announce twice. Drop the aria-label or use `aria-labelledby={h1Id}`.
- **P2 — `font-fredoka` / `font-nunito` utility classes** are used here but the global rule says headings = Fredoka by default. If `font-display` already maps to Fredoka in Tailwind config, the explicit class is duplicative (and potentially conflicting if the config changes).
- **P2 — "Last Updated: April 18, 2026"** is hardcoded. If this file is ever edited without bumping the date the policy becomes misleading. Consider a build-time injection or a top-level constant shared with `/terms`.
- **P3 — Missing `Organization` schema** (only Breadcrumb) — `/about` and `/contact` include both. Inconsistent.
- **P3 — Sections are all `<section>` with `<h2>`** — good. No skip-to-section TOC for an 9-section legal doc; consider on-scroll TOC for mobile.

**Risk**: `renderRichText` is XSS-safe (URL scheme allow-list, React escapes text). No issues.

**Verdict**: **Solid**. Date-staleness is the main long-term risk.

---

## F. `/terms` — Terms of Service

**Summary**: Mirror of `/privacy` — same renderer, same shell, 13 sections.

**Findings**
- All `/privacy` findings apply 1:1 (`aria-label` redundancy, font duplication, hardcoded "Last Updated", missing Organization schema).
- **P2 — 13 sections + dense legal text** — no in-page TOC. On mobile this is a long scroll. Add a sticky section nav or "back to top" button.
- **P3 — Section 5 mentions "48 hours"** for refund window inspection while `/privacy` mentions "7 days". These are different things, but cross-reference between docs would help.

**Risk**: None.

**Verdict**: **Solid**. Same opportunities as Privacy.

---

## Cross-page issues summary

1. **Hardcoded color violation** (P1): `HeroSection.tsx` uses a raw `hsl(...)` value. Memory rule explicitly forbids this. **Only one offender across these 6 pages.**
2. **Date staleness** (P2): `/privacy` and `/terms` both hardcode "April 18, 2026". Centralize into a shared `LEGAL_LAST_UPDATED` constant.
3. **Stats inconsistency** (P2): Home shows "5,000+ Farmers / 40+ Courses / 98% Satisfaction"; About shows "5K+ / 500+ / 50+ / 64". Single source of truth needed.
4. **Memoization inconsistency** (P2): `ContactPage` is the only page in this set not wrapped in `memo`.
5. **Redundant `aria-label` on `<main>`** (P2): `/faq`, `/privacy`, `/terms` all duplicate their H1 in the main landmark's aria-label.
6. **Two-success-signal anti-pattern** (P2): Contact page fires both a Sonner toast and an inline confirmation card.
7. **Memory drift** (P1): Contact cooldown is 30s in code, 3s in memory. Reconcile.
8. **Empty-state primitive not adopted** (P2): `/faq` uses bespoke empty markup instead of the shared `<EmptyState>`.
9. **Hero LCP** (P1): Static-imported full-res JPEG, no responsive `srcset`. Single biggest perf win available on this set.
10. **Auth-gated `/contact`** (P1, UX): Likely losing inquiries from anonymous visitors. Consider rate-limit + honeypot/captcha instead of a hard sign-in wall.
11. **Decorative emoji vs lucide icons** (P3): `/faq` is the lone emoji holdout.
12. **Touch targets**: `/faq` clear-button is 32px (sub-44 rule).

**No security/data-leakage findings on any of the 6 pages.** All inserts are RLS-guarded; legal renderer is XSS-safe; no PII exposed in markup; SEO/canonical URLs are correct everywhere.

**Recommended fix order if approved**:
1. Hero image responsiveness + token fix (`HeroSection.tsx`)
2. Reconcile contact cooldown vs memory + drop double-success
3. Shared legal-date constant + Organization schema for `/privacy` + `/terms`
4. `EmptyState` adoption in `/faq` + clear-button tap target
5. Stats single-source between `/` and `/about`
6. Cleanup pass: `aria-label` redundancy, `memo` on `ContactPage`, optional in-page TOC for `/terms`

Reply **go** to switch to default mode and apply this plan, or call out which items to skip.

