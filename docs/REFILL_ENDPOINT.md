# Subscription Refill Endpoint

## Overview
The `/api/subscriptions/refill` endpoint handles daily subscription token refills for paid users. It's designed to be called by external schedulers like Vercel Cron.

## Security
- Requires `Authorization: Bearer ${CRON_SECRET}` header
- Returns 401 for unauthorized requests

## How it works

1. **Query Eligible Accounts**: Finds accounts where:
   - `next_refill_at <= now()` (due for refill)
   - `stripe_subscription_id IS NOT NULL` (paid plans)
   - `plan_code != 'FREE'` 
   - Not recently refilled (3-day buffer)

2. **Stripe Verification**: For each account:
   - Retrieves subscription from Stripe API
   - Checks `cancel_at_period_end` status
   - Verifies subscription status is 'active' or 'trialing'
   - Optionally checks latest invoice payment status

3. **Token Refill**: 
   - Uses existing `refillSubscriptionTokens()` for idempotency
   - Adds plan's monthly tokens to balance
   - Updates refill timestamps
   - Creates ledger entry

4. **Downgrade Logic**: If `cancel_at_period_end = true`:
   - Does NOT add tokens
   - Downgrades to FREE plan
   - Clears all Stripe data
   - Keeps existing token balance

## Usage Examples

### Manual Testing (Development)
```bash
curl -X POST http://localhost:3000/api/subscriptions/refill \
  -H "Authorization: Bearer your_secure_cron_secret_here_change_in_production" \
  -H "Content-Type: application/json"
```

### Vercel Cron (Production)
```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/subscriptions/refill",
      "schedule": "0 0 * * *"  // Daily at 00:00 UTC
    }
  ]
}
```

### External Scheduler
```bash
curl -X POST https://your-domain.vercel.app/api/subscriptions/refill \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json"
```

## Response Format

### Success Response
```json
{
  "success": true,
  "processed": 25,
  "errors": 1,
  "downgrades": 3,
  "duration": "1250ms",
  "timestamp": "2025-11-01T10:30:00.000Z"
}
```

### Error Response
```json
{
  "error": "Refill job failed",
  "details": "Database connection timeout",
  "processed": 10,
  "errors": 15
}
```

## Safety Features

- **Idempotency**: Won't double-refill within the same period
- **Transaction safety**: All operations are atomic
- **3-day buffer**: Prevents accidental duplicate refills
- **In-memory filtering**: Avoids Date serialization issues with database queries
- **Comprehensive logging**: Detailed logs for monitoring and debugging

## Environment Variables

Add to `.env`:
```
CRON_SECRET=your_secure_cron_secret_here_change_in_production
STRIPE_SECRET_KEY=sk_test_...
```

## Monitoring

The endpoint logs detailed information for each step:
- 🔄 Job start/completion
- 📊 Account counts found
- 🔍 Individual account processing
- 💰 Token additions
- ⬇️ Plan downgrades
- ❌ Errors and failures