

# VET-MEDIX Security Audit Report

## Executive Summary

The application has a strong security foundation: all 34 tables have RLS enabled, no service_role key is exposed client-side, all admin/doctor/clinic routes use proper guard components, and edge functions implement JWT + role verification. However, there are several vulnerabilities ranging from critical to low severity that should be addressed.

---

## Findings (Ordered by Severity)

### CRITICAL -- P0

#### 1. Support Chat `sender_role` Spoofing

**Location:** `src/hooks/useSupportChat.ts` (line 304) + RLS on `support_messages`

**Issue:** The `sender_role` field is set client-side (`sender_role: 'admin'` or `sender_role: 'user'`). The RLS INSERT policies do not validate that the `sender_role` value matches the user's actual role. A regular user could craft a request setting `sender_role: 'admin'` to impersonate admin replies.

**Impact:** Any authenticated user could insert messages that appear as official admin responses in the support chat, enabling social engineering attacks.

**Fix:** Add a database trigger or modify the RLS `WITH CHECK` to enforce:
- If `sender_role = 'admin'`, the user must actually have the admin role
- If `sender_role = 'user'`, enforce `sender_role = 'user'` for non-admins

```text
Option A (Trigger):  BEFORE INSERT on support_messages
  -> IF NEW.sender_role = 'admin' AND NOT has_role(NEW.sender_id, 'admin')
  -> RAISE EXCEPTION

Option B (RLS):  Split INSERT policies to enforce role match
  -> User policy: WITH CHECK (sender_role = 'user' AND ...)
  -> Admin policy: WITH CHECK (sender_role = 'admin' AND has_role(...))
```

**Current status:** The admin INSERT policy *does* check `has_role`, but the user INSERT policy does not prevent setting `sender_role = 'admin'`. The user policy WITH CHECK is:
```sql
(auth.uid() = sender_id) AND EXISTS(SELECT 1 FROM support_conversations WHERE id = conversation_id AND user_id = auth.uid())
```
It does not restrict `sender_role`. A user could insert with `sender_role = 'admin'`.

---

### HIGH -- P1

#### 2. `contact_messages` INSERT Policy is Overly Permissive

**Location:** `contact_messages` table RLS

**Issue:** The INSERT policy uses `WITH CHECK (true)` allowing any authenticated user to insert arbitrary rows. While intentional for the contact form, the policy does not constrain *which* columns can be set. A user could insert rows with any `status` value (e.g., `'replied'`) or manipulate other fields.

**Impact:** Low data integrity risk. Status manipulation could hide legitimate messages from admin view.

**Fix:** Tighten the WITH CHECK to enforce safe defaults:
```sql
WITH CHECK (auth.role() = 'authenticated' AND status = 'unread')
```

This is already noted in the memory as intentional, but the lack of column constraints is a gap.

#### 3. Missing Input Sanitization on Support Chat Messages

**Location:** `src/hooks/useSupportChat.ts` (lines 132, 301)

**Issue:** Support chat messages are sent directly to the database with only `.trim()` applied -- no `sanitizeText()` or `isTextSafe()` validation. By contrast, posts and comments both use the full sanitization pipeline from `src/lib/sanitize.ts`.

**Impact:** Potential for stored XSS if messages are rendered without escaping elsewhere, or injection of malicious content.

**Fix:** Apply `sanitizeText()` and `isTextSafe()` checks before inserting support messages, matching the pattern used in `CreatePostCard.tsx` and `useComments.ts`.

#### 4. No Storage RLS Policies for `pet-media` Uploads (DELETE)

**Location:** Storage bucket `pet-media`

**Issue:** While INSERT is restricted to authenticated users, there are no DELETE policies for the `pet-media` bucket visible in the storage policies. This means users cannot clean up their own uploaded media, but more importantly, there's no ownership validation on uploads -- any authenticated user can upload to any path.

**Impact:** Storage abuse: any authenticated user can upload unlimited files to `pet-media` without ownership constraints on the file path.

**Fix:** Add path-based ownership validation for uploads:
```sql
WITH CHECK (bucket_id = 'pet-media' AND (storage.foldername(name))[1] = auth.uid()::text)
```

---

### MEDIUM -- P2

#### 5. CORS `Access-Control-Allow-Origin: *` on All Edge Functions

**Location:** All 5 edge functions (`steadfast`, `parse-product-pdf`, `upload-image-url`, `geocode`, `sitemap`)

**Issue:** Every edge function sets `Access-Control-Allow-Origin: *`. While JWT authentication protects the endpoints, the wildcard CORS allows any website to make credentialed requests.

**Impact:** If a user is logged in and visits a malicious website, that site could make API calls to your edge functions using the user's credentials (if cookies are used).

**Fix:** Restrict CORS to your production domain:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vetmedix.lovable.app",
  ...
};
```

#### 6. `product_categories` RLS Policies are RESTRICTIVE

**Location:** `product_categories` table

**Issue:** Both policies on `product_categories` are marked as `RESTRICTIVE` (not permissive). With restrictive policies, ALL policies must pass for access. This means the public SELECT and admin ALL policies conflict -- admins need BOTH to pass simultaneously, which could cause unexpected denials.

**Status:** This was partially fixed in a recent migration that recreated them as permissive, but the linter still flags a concern. Verify the current state matches expectations.

#### 7. Checkout Page Auth Guard is Client-Side Only

**Location:** `src/pages/CheckoutPage.tsx` (line 84)

**Issue:** The checkout page uses a `useEffect` redirect for unauthenticated users instead of the `RequireAuth` wrapper used elsewhere. This creates a brief window where the component renders before redirecting, and the guard can be bypassed if the effect doesn't fire.

**Impact:** Low -- the `create_order_with_stock` RPC has server-side auth checks. But the UX is inconsistent and could expose partial UI.

**Fix:** Wrap the `/checkout` route with `<RequireAuth>` in `App.tsx`, matching the pattern used for other protected routes.

---

### LOW -- P3

#### 8. `select-role` Route Has No Auth Guard

**Location:** `src/App.tsx` line 208

**Issue:** The `/select-role` route is not wrapped in `RequireAuth`. An unauthenticated user can navigate to it. The page likely handles this internally, but it's inconsistent with the guard pattern.

**Fix:** Wrap with `<RequireAuth>`.

#### 9. Admin Hook `useAdminSupportChat` Missing Admin Role Check

**Location:** `src/hooks/useSupportChat.ts` line 207

**Issue:** The `useAdminSupportChat` query is `enabled: !!user` instead of checking `isAdmin`. While RLS will block non-admin data access, unnecessary network requests are made for non-admin users if they somehow reach this code path.

**Fix:** Add admin role check: `enabled: !!user && isAdmin`.

#### 10. `dangerouslySetInnerHTML` Usage

**Location:** `src/pages/BlogArticlePage.tsx` (line 111), `src/pages/admin/AdminCMSEditor.tsx` (line 250)

**Issue:** Both use `dangerouslySetInnerHTML` with DOMPurify sanitization. This is the correct pattern, but DOMPurify defaults should be reviewed to ensure no bypass vectors exist (e.g., `ALLOW_UNKNOWN_PROTOCOLS`).

**Status:** Acceptable -- DOMPurify with default config is industry standard. No action needed unless custom config is added.

---

## Summary of What's Working Well

| Area | Status |
|---|---|
| RLS on all 34 tables | All enabled |
| No `service_role` key in frontend | Confirmed clean |
| Route guards (Admin/Doctor/Clinic) | All admin routes wrapped in `RequireAdmin` |
| Edge function JWT verification | All 5 functions verify auth |
| Edge function admin-only actions | Properly gated |
| Input sanitization (posts/comments) | Uses `sanitizeText` + `isTextSafe` |
| Storage private buckets | `clinic-documents` and `doctor-documents` are private |
| Signed URLs for sensitive docs | Properly implemented |
| `SECURITY DEFINER` functions | Used for role checks avoiding recursion |
| Atomic stock management | `FOR UPDATE` row locks in `create_order_with_stock` |
| Public views exclude sensitive data | `clinics_public`, `doctors_public`, `profiles_public` |

---

## Recommended Fix Priority

```text
Priority   | Issue                                      | Effort
-----------+--------------------------------------------+--------
P0 (now)   | #1 sender_role spoofing                    | Small (SQL migration)
P1 (soon)  | #3 Sanitize support chat input             | Small (code change)
P1 (soon)  | #2 contact_messages INSERT constraint      | Small (SQL migration)
P1 (soon)  | #4 pet-media storage path validation       | Small (SQL migration)
P2 (next)  | #5 CORS wildcard on edge functions         | Small (code change)
P2 (next)  | #7 Checkout RequireAuth wrapper            | Trivial (1 line)
P2 (next)  | #6 product_categories policy type          | Verify only
P3 (later) | #8 select-role auth guard                  | Trivial
P3 (later) | #9 Admin hook enabled check                | Trivial
```

Ready to implement fixes on your approval, starting with the critical `sender_role` spoofing vulnerability.

