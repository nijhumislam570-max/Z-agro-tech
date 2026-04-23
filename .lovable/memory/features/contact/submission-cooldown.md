---
name: Contact Submission Cooldown
description: Contact form enforces 30-second cooldown after successful submission and prefills name/email from auth profile
type: feature
---

# Contact Form Behavior

## Cooldown
- After a successful submission, the "Send Another Message" button is disabled for **30 seconds** (`COOLDOWN_SECONDS` in `src/pages/ContactPage.tsx`).
- A `role="progressbar"` indicator visually counts down.
- Cooldown also blocks `onSubmit` re-entry and the `handleSendAnother` reset.

## Auth-gated form
- Anonymous users see a "Sign in Required" CTA — sign-in is required to send.
- Once signed in, `name` defaults to `profile.full_name ?? user.user_metadata.full_name`, `email` defaults to `user.email`. Prefill only fires for empty fields so we never clobber user typing.

## Persistence
- Inserts to `contact_messages` via `safeMutation`. The table has no `user_id` column — only the email/name link a message back to the submitter.
