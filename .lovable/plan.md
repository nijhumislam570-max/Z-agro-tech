

# Read-Only Audit — Auth Pages

Scope: `/auth`, `/forgot-password`, `/reset-password`. **No code changes** — findings only. Priority labels: **P1** (security/correctness, fix soon), **P2** (polish), **P3** (nice-to-have).

---

## A. `/auth` — Sign In / Sign Up

**Summary**: Split-screen layout (branding panel + glassmorphism form card), shadcn Tabs for Sign In / Sign Up, react-hook-form + Zod (`loginSchema`, `signupSchema`), separate password-visibility state per form, Google/Apple OAuth via `lovable.auth.signInWithOAuth`, post-auth role-based redirect with `?redirect=` honoring, inline post-signup verification banner. Selector hooks (`useAuthUser`, `useAuthLoading`, `useAuthActions`) avoid token-rotation re-renders.

**Findings**

- **P1 — Open redirect risk in `oauthRedirectUri`** (line 91-95). `fromPath` comes from `?redirect=` query string. Code only checks `fromPath.startsWith('/')` — that allows `//evil.com/path` (protocol-relative URL). Browsers resolve `https://zagrotech.lovable.app//evil.com` as `//evil.com`. Mitigation: also reject `fromPath.startsWith('//')` and `fromPath.includes('\\')`.
- **P1 — `redirectAfterAuth` always queries `user_roles`** (line 71-76) even when a `fromPath` redirect is requested — but only after the early return. Actually correct on re-read. **However**, the query is `.select('role').eq('user_id', userId)` with **no `.maybeSingle()` and no error handling**. If RLS denies (shouldn't, since the user-views-own-role policy exists) or the network drops, `roleData` is `undefined` and the user lands on `/dashboard` — silent failure. Wrap in try/catch + log.
- **P1 — `useEffect` redirect race** (line 79-86). When `signIn` succeeds, the listener fires → `user` populates → effect redirects. But the `onLogin` toast fires immediately after `signIn` returns. If the user is already redirected by the time the toast renders, that's fine. The bigger issue: the effect calls `redirectAfterAuth` **every time** `user` changes, including after token rotation — `user` reference changes on every refresh in `AuthContext` (line 31 `state = { ...state }`). That re-fires `redirectAfterAuth`, re-queries `user_roles`, and tries to `navigate(...)` while already on a different page. Likely a no-op due to `replace: true`, but it's wasted work and a race vector.
- **P1 — Email enumeration via `friendlyAuthMessage`** (line 119-130). Mapping `'User already registered'` → `"An account with this email already exists. Please sign in instead."` confirms account existence to attackers performing signup-based enumeration. Industry standard is to return the same generic success message regardless and rely on email verification to resolve. (Trade-off: worse UX. Document the choice.)
- **P1 — No CAPTCHA / rate limit on the client side**. Supabase has built-in rate limiting, but the form has zero throttling between submit attempts. A bot can hammer `signIn` until they hit Supabase's 429. Consider an on-failure cool-down (e.g., 1s after each error).
- **P2 — `redirectAfterAuth` race with admin check**: between `signIn` resolving and the `useEffect` running, `roleData` query takes a round-trip. Briefly the user sits on `/auth` after success. Add an inline "Redirecting…" overlay during this window.
- **P2 — `signIn` errors are caught and re-thrown**: `onLogin` calls `signIn`, gets `{ error }`, then `throw error`. The try/catch is purely cosmetic — could destructure and toast directly.
- **P2 — `pendingVerificationEmail` cleared on tab switch to non-signin** (line 176). But the user is **switched to** `signin` (line 159), so the banner is shown on signin. If the user then switches to signup and back, the banner is gone. Subtle but the conditional `if (v !== 'signin')` is backwards from intent — it should clear when leaving signin, not entering signup. Currently works because it only clears when switching **to** signup (the only other tab), but reads ambiguously.
- **P2 — `getSession()` after signup** (line 154) is racy. If email confirmation is **disabled**, the listener will populate the session asynchronously; `getSession()` may return the just-created session OR null depending on timing. Better: check `data.user?.email_confirmed_at` from the `signUp` response.
- **P2 — `signupSchema` has no password-confirmation field**. Users typing a typo'd password create the account anyway and only discover it on next login. Add `confirmPassword` + `.refine()` cross-check.
- **P2 — Password visibility toggle** is two separate `useState` (lines 23-24) — fine, but the inline `<button>` is `tabIndex` 0 and sits between the password input and the Submit button → screen-reader and keyboard users tab through it. Consider `tabIndex={-1}` so it doesn't intercept tab order.
- **P2 — OAuth buttons have no ToS/Privacy gating**. Single click → external redirect → account created. Memory rule and best practice want a "By continuing you agree to…" line under the OAuth row.
- **P2 — `anyLoading` blocks both submit buttons across tabs** (line 192). If a Google sign-in is in flight, the user can't even type in the email tab. Acceptable but heavy-handed.
- **P3 — `friendlyAuthMessage`** does case-insensitive substring on raw error text. Brittle if Supabase re-words errors. Use error `code`/`status` where available.
- **P3 — Logo image (`zagrotech-logo-circle.png`)** is statically imported and used twice (desktop + mobile). Fine, but no `width`/`height` attributes — minor CLS.
- **P3 — Tabs use `mb-6 h-11`** — touch targets pass 44px. ✅

**Risk**:
- **HIGH (P1)**: Open-redirect via `//host` in `?redirect=` parameter. Could be used in phishing chains.
- **MEDIUM (P1)**: Email enumeration on signup path.
- **LOW**: Re-render churn on token rotation; cosmetic.

**Verdict**: **Functionally solid, security needs hardening** — sanitize redirect targets, neutralize signup-path enumeration, and document the trade-off for the friendly error.

---

## B. `/forgot-password` — Forgot Password

**Summary**: Single email input → `supabase.auth.resetPasswordForEmail` with `redirectTo: ${origin}/reset-password`. Inline "check your email" success card with "try again" affordance. Pre-fills email from router state (passed by Auth page's "Forgot password?" link). Uses `emailSchema` for validation.

**Findings**

- **P1 — `useCallback(handleSubmit, [email])`** rebuilds on every keystroke — defeats `useCallback`'s purpose entirely (line 28-63). The function depends on `email` which is the controlled input. Either drop `useCallback` or use `useRef` for a stable handler.
- **P1 — Friendly error mapping is good** but `'rate limit'` and `'for security purposes'` checks (line 52) duplicate Supabase's own copy. If Supabase changes wording, the friendly message falls through to the generic "Failed to send reset link" which is acceptable but loses the rate-limit signal.
- **P1 — `setSent(true)` always succeeds** even when Supabase returns a non-error response for an unknown email (intentional — Supabase does not reveal account existence). ✅ This is correct behavior for preventing enumeration. Document it.
- **P2 — `useEffect(() => { if (!sent) emailInputRef.current?.focus() }, [sent])`** runs on initial mount and re-focuses every time `sent` flips to false (the "try again" button). Combined with `autoFocus` on the input (line 126), this is **double focus management** — the autoFocus fires first, then the effect. Pick one.
- **P2 — No rate-limit feedback in the success card**. If a user clicks "try again" within the cool-down, they'll get the rate-limit toast — but the form button is enabled. Consider a 30s client-side cool-down on the "try again" button.
- **P2 — `error: any` typing** (line 49) — every other auth file uses `unknown` with type guards. Inconsistent.
- **P2 — `useDocumentTitle` not used** — page relies on `<SEO>` only. ✅ (correctly so)
- **P2 — Missing `<main id="main-content">` landmark** — the file uses a `<div>` root. Memory rule requires every page to have exactly one `<main>` landmark. Add `<main id="main-content">`.
- **P2 — Missing visible/sr-only `<h1>`** — `CardTitle` renders a `<div>` (shadcn default), not `<h1>`. The page therefore has **zero h1**, violating the per-page H1 rule. Wrap CardTitle's `as="h1"` or add `<h1 className="sr-only">`.
- **P2 — Logo wrapper** — the centered `<Logo size="lg" />` has no link back to `/`. The `ArrowLeft` link at the bottom is the only back affordance. Acceptable but inconsistent with the desktop branding panel on `/auth` where the logo is the primary back-link.
- **P2 — `prefilledEmail`** taken from `location.state` is convenient, but the user can also land here directly. No friendly empty state — `autoFocus` mitigates.
- **P3 — Network/HTTP errors mapped strictly via substring** ('network', 'failed to fetch'). Modern fetch failures may show `TypeError: Load failed` (Safari). Pattern incomplete.
- **P3 — Submit button disabled on `!email.trim()`** but typing a single space then deleting leaves a stale `emailError` message until the next keystroke clears it.

**Risk**:
- **NONE — enumeration resistance is correct**. Supabase intentionally returns success for unknown emails on `resetPasswordForEmail`, and the page does not differentiate.

**Verdict**: **Correct security posture**, several polish issues. Top priority: `useCallback` dependency churn and missing `<main>` + `<h1>` landmarks.

---

## C. `/reset-password` — Reset Password

**Summary**: Detects recovery session (either via `useAuthUser` already populated, or hash containing `type=recovery` with an 8s timeout). On submit: validates with `passwordSchema`, confirms match, calls `supabase.auth.updateUser({ password })`, signs out the recovery session (forces re-auth on shared devices), redirects to `/auth` after 3s. Includes expired-link fallback UI.

**Findings**

- **P1 — Confirm-password is `===` compared** (line 77). String equality is fine, but the schema doesn't enforce minimum match — a typo'd confirm is caught. ✅
- **P1 — Session timeout logic is brittle** (line 53-64). The 8s `setTimeout` fires once, then checks `getSession()`. If the listener fires at t=8.1s, `setSessionError(true)` already ran → user sees "Link Expired" while the session is actually valid. Race is tight but real on slow connections.
- **P1 — Hash-token detection** (line 46) checks for `type=recovery` OR `access_token`. Supabase's recovery URL is `#access_token=...&type=recovery&...`. If a user has a generic stale `#access_token` hash from a previous sign-in (rare), this page would think it's a recovery link and refuse to error out. Low impact but loose.
- **P1 — `supabase.auth.signOut()` after password update** (line 108). This signs out **all** sessions globally only if scope is `'global'`. Default scope is `'local'` → only signs out the current device. Other devices keep their session despite the password change. **Recommend**: `supabase.auth.signOut({ scope: 'others' })` or `'global'` to invalidate all sessions when a password is reset (industry standard for "account compromised" scenarios).
- **P1 — Error mapping too narrow** (line 88-94). `session_not_found`, `pgrst301`, `refresh_token`, `invalid token`, `expired` — but Supabase's actual error code for an expired recovery link is often `otp_expired` (or generic `Token has expired or is invalid`). Add those substrings.
- **P2 — `setTimeout(() => navigate('/forgot-password'), 2000)`** (line 96) has no cleanup. If the user navigates away before 2s, the timer still fires and could `navigate()` from a different page. Wrap in `useEffect` cleanup or use a ref-stored timer.
- **P2 — Same for the success-redirect `setTimeout`** (line 112) — 3s navigate without cleanup.
- **P2 — `passwordSchema` only requires 8+ chars, letter, number** — no symbol, no entropy check, no leaked-password check. Memory rule notes `password_hibp_enabled` should be enabled in Supabase. Recommend turning that on (server-side gate).
- **P2 — No re-authentication challenge before password update**. A user with a hijacked session (stolen cookie/token) could change the password without re-entering the old one. Recovery flow doesn't need this (token IS the auth), but if an already-logged-in user navigates to `/reset-password`, they can change their password without confirming the current one. Add `currentPassword` field when `user` is present and **not** in recovery flow.
- **P2 — Missing `<main id="main-content">` landmark** — same issue as `/forgot-password`.
- **P2 — Missing semantic `<h1>`** — `CardTitle` is a `<div>`. Page has zero h1.
- **P2 — `error: any` typing** (line 113) — inconsistent with `unknown` pattern elsewhere.
- **P3 — `RECOVERY_TIMEOUT_MS = 8000`** is a long perceived wait. Show a "Verifying link…" message during this window so the user knows something is happening. Currently the form is disabled with `Verifying link…` button text — ✅ already covered.
- **P3 — Two password-visibility toggles** with separate state — fine, but consider a single linked toggle ("show passwords") since they're related fields.

**Risk**:
- **MEDIUM (P1)**: `signOut` scope — password reset doesn't invalidate other-device sessions.
- **LOW**: `setTimeout` without cleanup → potential navigate from unmounted component (React warns in dev).
- **LOW**: Race window in session-detection timeout could lock a valid session out as "Link Expired".

**Verdict**: **Functionally correct**, security gap is the `signOut` scope. Easy fix with high security value.

---

## Cross-Page Auth System Risks

### Critical / High (P1)

1. **Open-redirect via `?redirect=//evil.com`** in `AuthPage.tsx`. Sanitize: reject `//`, `\\`, and any non-relative path. Use a `URL()` constructor parse to enforce same-origin.
2. **Email enumeration on signup path** — `'User already registered'` mapped to a confirming message. Trade-off vs UX; recommend documenting the choice and considering removal.
3. **`signOut` after password reset is `local` scope** — other devices keep working. Should be `'others'` or `'global'` to enforce session invalidation on password change.
4. **No leaked-password protection** — `password_hibp_enabled` should be turned on in Supabase Auth settings (server-side gate, no code change).
5. **No client-side rate limiting** on any auth form — relies entirely on Supabase's 429. Add per-form cool-down after errors.

### Medium (P2)

6. **Missing `<main id="main-content">` landmark** on `/forgot-password` and `/reset-password`. Memory rule violation.
7. **Missing `<h1>`** on both `/forgot-password` and `/reset-password` (CardTitle is `<div>`). Memory rule violation.
8. **`signupSchema` lacks `confirmPassword`** — typos create unrecoverable accounts.
9. **`setTimeout` without cleanup** in `ResetPasswordPage` — two navigate-after-delay calls leak.
10. **`error: any`** in two places — inconsistent with the `unknown` + type-guard pattern used in `AuthPage`.
11. **`useCallback([email])`** in `ForgotPasswordPage` — defeats memoization.
12. **No "current password required" challenge** when a logged-in user lands on `/reset-password` outside a recovery flow.

### Low (P3)

13. **Substring-based error mapping is brittle** across all three files. Supabase error `code` / `status` would be more stable.
14. **OAuth buttons lack ToS gating** on `/auth`.
15. **Password-visibility toggle in tab order** — interrupts keyboard flow in `/auth`.
16. **Race window in `RECOVERY_TIMEOUT_MS`** — slow connections could see a false "Link Expired" UI.
17. **Logo on auth pages** has no width/height — minor CLS.

### Confirmed Strengths

- ✅ Tab forms reset on switch (no cross-leaking input state).
- ✅ Separate password-visibility state per form.
- ✅ `aria-invalid`, `aria-busy`, `role="alert"` properly used for error/loading states.
- ✅ Selector hooks (`useAuthUser`, `useAuthLoading`) prevent token-rotation re-renders.
- ✅ Recovery flow signs out the recovery-only session before redirect (prevents staying logged in on shared devices).
- ✅ Forgot-password is enumeration-resistant (always shows "sent" UI regardless of account existence).
- ✅ Auth pages are full-bleed (no `PublicShell`) — confirmed in `App.tsx` route config.
- ✅ Recovery-link expired/invalid state has its own clean fallback UI.
- ✅ All forms use `noValidate` to opt-out of native browser validation in favor of Zod.
- ✅ All buttons meet 44px touch-target rule.

### Recommended Fix Order

1. **P1 SECURITY**: Sanitize `oauthRedirectUri` against `//` and `\\` open-redirect vectors.
2. **P1 SECURITY**: Change `signOut` scope to `'others'` after password reset (or `'global'` if you want to log out the resetting user too — current code already redirects them to `/auth`).
3. **P1 SECURITY**: Enable `password_hibp_enabled` in Supabase Auth config.
4. **P1 UX/SEC**: Decide on signup-path enumeration trade-off (suppress confirming error or accept the UX win).
5. **P2 A11Y**: Add `<main id="main-content">` + `<h1>` (sr-only ok) to `/forgot-password` and `/reset-password`.
6. **P2 CORRECTNESS**: Add `confirmPassword` to `signupSchema`.
7. **P2 CORRECTNESS**: Wrap the two `setTimeout(navigate)` calls in `ResetPasswordPage` with cleanup.
8. **P2 PERF**: Drop `useCallback` (or stabilize)