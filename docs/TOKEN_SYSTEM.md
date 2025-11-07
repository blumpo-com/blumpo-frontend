# Token Management System

## Overview

This document describes how the token-based billing and consumption system works for the web application.  
At the current stage, **each ad generation costs a fixed number of tokens (20)**, and users can obtain tokens through a **monthly subscription plan** or **one-time top-ups**.

---

## 1. Token Cost

- Every ad generation (based only on a submitted website URL) consumes a **fixed cost of 20 tokens**.
- If the user does not have enough tokens, the generation request is **rejected immediately** (`status = FAILED`, `error_code = INSUFFICIENT_TOKENS`).
- Once a job is successfully created:
  - 20 tokens are **reserved** (deducted from balance).
  - If the generation **fails**, those 20 tokens are **refunded** automatically.

---

## 2. Subscription Plans

Only **four subscription plans** are available.  
They differ by the number of monthly tokens, features, and user limits.

| Plan Code | Monthly Tokens | Ads per Month | Price / month | Description |
|------------|----------------|---------------|----------------|-------------|
| `FREE`     | 50 tokens      | 2-3 ads       | **Free**       | Trial tier with limited usage. |
| `STARTER`  | 1,000 tokens   | 50 ads        | **$17 / month** | For individual creators with occasional use. |
| `GROWTH`   | 3,000 tokens   | 150 ads       | **$39 / month** | For small businesses and marketers. |
| `TEAM`     | 40,000 tokens  | 2,000 ads     | **$199 / month** | For medium size agencies and marketing teams. |

### Renewal Behavior

- Tokens are **reset each month** (no rollover of unused tokens).  
- On each billing cycle start, the account balance is set to the plan’s `tokens_per_period`.
- This event is logged in the `token_ledger` table with:
  - `reason = 'SUBS_REFILL'`
  - `reference_id = YYYY-MM-01`
- Stripe webhooks trigger refills automatically (`invoice.payment_succeeded`).

---

## 3. One-Time Token Top-Ups

Users can buy additional tokens at any time.  
Top-ups immediately increase the token balance and do not affect the subscription status or renewal date.

| SKU | Tokens Added | Price | Suggested Stripe Price ID |
|------|---------------|--------|-----------------------------|
| `TOPUP_100` | 100 | $5 | `price_topup_100` |
| `TOPUP_500` | 500 | $19 | `price_topup_500` |
| `TOPUP_2000` | 2,000 | $59 | `price_topup_2000` |

Each purchase creates a `token_ledger` entry with:
- `delta = +<tokens>`
- `reason = 'TOPUP_PURCHASE:<price_id>'`
- `reference_id = <checkout_session_id>`

---

## 4. Token Ledger Rules

All token changes are tracked in the `token_ledger` table.

| Action | Ledger Reason | Delta | Description |
|---------|----------------|--------|--------------|
| Subscription refill | `SUBS_REFILL` | +X | Monthly refill for plan. |
| Ad generation (reserve) | `JOB_RESERVE` | −20 | Token cost when job is created. |
| Failed job refund | `JOB_REFUND` | +20 | Refund when generation fails. |
| Top-up purchase | `TOPUP_PURCHASE:<id>` | +X | Stripe one-time payment. |

Ledger entries are **idempotent** — each has a unique `(reason, reference_id)` combination.

---

## 5. Refill Logic (Monthly Reset)

When a subscription period ends:

1. Check users where `next_refill_at <= now()`.
2. For each, calculate: new_balance = tokens_per_period
3. Create a `token_ledger` entry (`SUBS_REFILL`).
4. Update:
- `token_account.balance = new_balance`
- `last_refill_at = now()`
- `next_refill_at = now() + interval '1 month'`

No rollover — unused tokens are lost at the end of each month.

---

## 6. SQL / Server Logic Summary

### Reserve Tokens (when creating a job)
- Check if `balance >= 20`.
- If true:
- Insert `token_ledger` (`delta = -20`, `reason = JOB_RESERVE`).
- Update `token_account.balance`.
- Set `generation_job.tokens_cost = 20`, `status = QUEUED`.
- If false → reject (`INSUFFICIENT_TOKENS`).

### Refund Tokens (on job failure)
- Check if a refund entry already exists (idempotency).
- If not, insert `token_ledger` (`delta = +20`, `reason = JOB_REFUND`) and update balance.

### Monthly Refill (cron or webhook)
- Triggered by `next_refill_at` or Stripe event.
- Reset balance to `tokens_per_period`.

---

## 7. Technical Notes

- `token_account` table stores the live balance and subscription data.
- `token_ledger` records **every** change with before/after balances.
- All modifications are executed in SQL transactions with `FOR UPDATE` to prevent race conditions.
- Stripe integration ensures billing and refill events are idempotent.

---

## 8. Example Balance Flow

**User on `STARTER` plan (1,000 tokens/month):**

1. Subscription refill → +1,000 (balance = 1,000)
2. Generate ad #1 → −20 → (balance = 980)
3. Generate ad #2 → −20 → (balance = 960)
4. One job fails → +20 refund → (balance = 980)
5. Top-up purchase (500 tokens) → +500 → (balance = 1,480)

Next month:
- Subscription refill → balance reset to 1,000 (no rollover).

---

## 9. Future Extensions

This static-cost model will evolve as new parameters are introduced (e.g., ad type, media assets, duration).  
Future token cost may depend on:
- Number of assets generated
- Ad type (image / video)
- Output resolution
- Additional AI features

Until then, the cost remains **fixed at 20 tokens per generation** for simplicity and predictability.

---

**Last updated:** October 2025
