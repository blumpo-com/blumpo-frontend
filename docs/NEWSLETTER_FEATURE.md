# Newsletter Subscription Feature

This document describes how the newsletter subscription feature works in Blumpo, including the double opt-in flow for unregistered users, the direct subscription path for known accounts, and the confirmation page.

---

## Overview

The newsletter form lives in the landing page footer (`footer-section.tsx`). When a user submits their email, the system chooses one of two paths depending on whether the email belongs to an existing Blumpo account:

- **Known user** (email exists in the `user` table) → subscribed instantly, no email sent.
- **Unknown email** → a signed confirmation link is emailed; the subscription is only saved after the user clicks it.

This double opt-in approach for unknown emails ensures list quality and avoids storing unverified addresses.

---

## Subscription Flow

### Path A — Known Blumpo user

```
Footer form → POST /api/newsletter/subscribe
  → getUserByEmail() finds a match
  → addNewsletterSubscriber(email, userId) — confirmedAt = NOW()
  → returns { status: "subscribed" }
  → footer shows "You're in!" dialog
```

### Path B — Unknown email (double opt-in)

```
Footer form → POST /api/newsletter/subscribe
  → getUserByEmail() finds no match
  → signNewsletterToken(email) — signed JWT, 24h expiry
  → Resend sends confirmation email with link:
      {BASE_URL}/newsletter/confirm?token=<JWT>
  → returns { status: "email-sent" }
  → footer shows "Check your email" dialog

User clicks link in email
  → GET /newsletter/confirm?token=<JWT>
  → verifyNewsletterToken() — validates signature + expiry
  → isEmailSubscribed() — guards against duplicate inserts
  → addNewsletterSubscriber(email) — confirmedAt = NOW()
  → Confirmation page shows success state
```

### Already subscribed

```
Footer form → POST /api/newsletter/subscribe
  → isEmailSubscribed() returns true
  → returns { status: "already-subscribed" }
  → footer shows "Already subscribed" dialog
```

---

## File Map

| File | Purpose |
|------|---------|
| `app/(landing)/_sections/footer-section.tsx` | Newsletter form UI + dialog state |
| `app/api/newsletter/subscribe/route.ts` | POST endpoint — main subscription logic |
| `app/(landing)/newsletter/confirm/page.tsx` | Server component — confirms token and writes to DB |
| `components/newsletter-dialog.tsx` | Dialog shown after form submission |
| `lib/auth/newsletter-token.ts` | Sign and verify confirmation JWTs |
| `lib/auth/templates/newsletterConfirmationEmailTemplate.ts` | HTML email with confirmation CTA button |
| `lib/db/schema/newsletter.ts` | `newsletter_subscription` Drizzle schema |
| `lib/db/queries/newsletter.ts` | `isEmailSubscribed`, `addNewsletterSubscriber` |

---

## Database Schema

**Table**: `newsletter_subscription`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `email` | `text` | Unique, stored lowercased |
| `user_id` | `uuid` | Nullable FK → `user.id` (set null on delete) |
| `subscribed_at` | `timestamptz` | Defaults to `NOW()` |
| `confirmed_at` | `timestamptz` | Always set at insert time (no unconfirmed rows stored) |

> **Note**: The `confirmed_at` column exists for historical clarity and potential future use (e.g. audit trails). Under the current flow, all rows in the table are confirmed — unconfirmed addresses never reach the DB.

---

## API Reference

### `POST /api/newsletter/subscribe`

Accepts an email from the footer form and decides which path to take.

**Request body**
```json
{ "email": "user@example.com" }
```

**Response statuses**

| `status` | Meaning |
|----------|---------|
| `subscribed` | Known user, added to DB directly |
| `email-sent` | Unknown email, confirmation email dispatched |
| `already-subscribed` | Email already in `newsletter_subscription` |

**Error responses**

| HTTP | Body | Cause |
|------|------|-------|
| `400` | `{ "error": "Email is required" }` | Missing or non-string email |
| `400` | `{ "error": "Invalid email address" }` | Fails basic format check |
| `500` | `{ "error": "Failed to send confirmation email" }` | Resend API error |
| `500` | `{ "error": "Internal server error" }` | Unexpected exception |

---

### `GET /newsletter/confirm?token=<JWT>`

Server-rendered page. Verifies the confirmation token and stores the subscription.

**Token payload** (signed with `AUTH_SECRET`, expires in 24 hours)
```json
{ "email": "user@example.com", "purpose": "NEWSLETTER_CONFIRM" }
```

**Page states**

| State | Condition |
|-------|-----------|
| `success` | Token valid, email stored |
| `already-subscribed` | Token valid, email already in DB (e.g. double-click) |
| `expired` | JWT verification failed (expired or tampered) |
| `invalid` | No `token` query param present |

---

## Confirmation Email

**Subject**: `Confirm your Blumpo newsletter subscription`

**From**: `Blumpo <no-reply@blumpo.com>`

The email renders a single "Confirm subscription" CTA button that links to:
```
{BASE_URL}/newsletter/confirm?token=<signed-JWT>
```

The template is defined in `lib/auth/templates/newsletterConfirmationEmailTemplate.ts` and follows the same HTML/inline-style pattern as the OTP email template.

---

## Confirmation Token

Tokens are signed JWTs using the `jose` library (same as session tokens).

```typescript
// lib/auth/newsletter-token.ts
signNewsletterToken(email)    // HS256, expires in 24h
verifyNewsletterToken(token)  // returns email string or null
```

Key properties:
- Algorithm: `HS256`
- Secret: `process.env.AUTH_SECRET`
- Expiry: 24 hours
- Payload: `{ email, purpose: "NEWSLETTER_CONFIRM" }`
- Verification rejects tokens with wrong `purpose` to prevent cross-use

---

## Dialog States

`components/newsletter-dialog.tsx` renders a `Dialog` from `@/components/ui/dialog` with four possible states driven by the API response:

| Status | Title | Description |
|--------|-------|-------------|
| `subscribed` | You're in! | Added directly as a known user |
| `email-sent` | Check your email | Confirmation email sent |
| `already-subscribed` | Already subscribed | Email was already in the list |
| `error` | Something went wrong | Network or server error |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | HMAC secret used to sign newsletter tokens |
| `RESEND_API_KEY` | Yes | Resend API key for sending confirmation emails |
| `BASE_URL` | Yes | Base URL used to build the confirmation link (e.g. `https://blumpo.com`) |

---

## Security Considerations

- **No DB write before confirmation**: Unknown emails are never stored until the user proves access to the inbox.
- **Signed tokens**: Tokens are HMAC-signed with `AUTH_SECRET`. They cannot be forged without the secret.
- **Short expiry**: 24-hour window limits the attack surface for leaked links.
- **Purpose binding**: The `purpose: "NEWSLETTER_CONFIRM"` claim prevents newsletter tokens from being accepted by other verification flows.
- **Idempotent confirmation**: Clicking the link twice is safe — `isEmailSubscribed()` guards the insert.
- **Email normalisation**: All emails are stored lowercased to prevent duplicate entries from case variations.

---

## Related Documentation

- `docs/database_schema.md` — Full database schema reference
- `lib/auth/otp.ts` — OTP email flow (uses the same Resend client)
- `lib/auth/session.ts` — Session JWT implementation (same `jose` pattern)
