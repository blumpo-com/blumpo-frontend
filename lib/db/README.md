# Database Schema - Blumpo Frontend

This document provides comprehensive information about the database schema, setup, and usage for the Blumpo token-based image generation platform.

## Prerequisites

- **PostgreSQL** 14+ database server
- **Node.js** 18+ with pnpm package manager
- **Environment Variables**: `DATABASE_URL` or `POSTGRES_URL` in your `.env` file

## Initial Setup

1. **Configure Database URL**
   ```bash
   # Add to your .env file
   DATABASE_URL="postgresql://username:password@localhost:5432/blumpo_db"
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Generate and Apply Migrations**
   ```bash
   pnpm db:generate  # Generate Drizzle artifacts
   pnpm db:migrate   # Apply migrations to database
   ```

4. **Seed Development Data** (Optional)
   ```bash
   pnpm db:seed     # Create test user and sample data
   ```

## Available Scripts

- `pnpm db:generate` - Generate Drizzle schema artifacts
- `pnpm db:migrate` - Apply pending migrations to database
- `pnpm db:studio` - Open Drizzle Studio for database inspection
- `pnpm db:seed` - Seed database with test data

## Database Schema Overview

### Entity Relationship Diagram (Text)

```
┌─────────────┐    1:1     ┌──────────────┐
│    User     │◄──────────►│ TokenAccount │
└─────────────┘            └──────────────┘
       │ 1:N                       │ 1:N
       ▼                           ▼
┌──────────────┐            ┌──────────────┐
│ TokenLedger  │            │ GenerationJob│
└──────────────┘            └──────────────┘
       │ 1:1                       │ 1:N
       └──────────────────┬────────┘
                          ▼
                   ┌──────────────┐    1:N    ┌─────────────────┐
                   │  AssetImage  │◄─────────►│ AssetImageVariant│
                   └──────────────┘           └─────────────────┘

┌─────────────┐    N:1
│   AuthOTP   │◄─────── User (optional)
└─────────────┘
```

### Core Entities

1. **User** - Platform users with email-based authentication
2. **TokenAccount** - User's token balance and subscription plan (1:1 with User)
3. **TokenLedger** - Audit log of all token transactions
4. **GenerationJob** - AI image generation requests
5. **AssetImage** - Generated image assets
6. **AssetImageVariant** - Different sizes/formats of images (thumbnails, web, print)
7. **AuthOTP** - One-time password challenges for authentication

## Common Queries

### User and Token Management

```typescript
import { getUserWithTokenBalance, getTokenBalance } from '@/lib/db/queries';

// Get user with current token balance
const userWithBalance = await getUserWithTokenBalance(userId);
console.log(`Balance: ${userWithBalance.tokenAccount?.balance || 0} tokens`);

// Get token balance only
const balance = await getTokenBalance(userId);
```

### Token Transactions (Idempotent)

```typescript
import { appendTokenLedgerEntry } from '@/lib/db/queries';

// Deduct tokens for generation (idempotent with referenceId)
try {
  const ledgerEntry = await appendTokenLedgerEntry(
    userId,
    -10,                    // Delta (negative for deduction)
    'GENERATION',           // Reason
    `job_${generationId}`   // Reference ID for idempotency
  );
  console.log(`New balance: ${ledgerEntry.balanceAfter}`);
} catch (error) {
  console.error('Insufficient tokens or transaction failed');
}

// Add tokens (e.g., monthly refill)
await appendTokenLedgerEntry(
  userId,
  50,                     // Delta (positive for addition)
  'MONTHLY_REFILL',       // Reason
  `refill_${Date.now()}`  // Reference ID
);
```

### Generation Jobs

```typescript
import { createGenerationJob, updateGenerationJobStatus } from '@/lib/db/queries';

// Create new generation job (atomic with token deduction)
const job = await createGenerationJob(userId, {
  id: crypto.randomUUID(),
  prompt: 'A beautiful landscape',
  params: { width: 1024, height: 1024, steps: 20 },
  tokensCost: 10
});

// Update job status
await updateGenerationJobStatus(job.id, 'RUNNING');
await updateGenerationJobStatus(job.id, 'SUCCEEDED');
```

### Asset Management

```typescript
import { attachAssetToJob, getAssetsForUser } from '@/lib/db/queries';

// Attach generated asset to job
const asset = await attachAssetToJob(jobId, userId, {
  id: crypto.randomUUID(),
  title: 'Beautiful Landscape',
  storageKey: 'users/123/jobs/456/image.webp',
  mimeType: 'image/webp',
  bytesSize: 524288,
  width: 1024,
  height: 1024,
  format: 'WEBP'
});

// Get user's assets
const userAssets = await getAssetsForUser(userId, 20);
```

## Safety and Transaction Notes

### Token Account Locking

Always use `FOR UPDATE` when modifying token balances to prevent race conditions:

```sql
-- This is handled automatically in appendTokenLedgerEntry()
SELECT * FROM token_account WHERE user_id = $1 FOR UPDATE;
```

### Idempotency with Reference IDs

Use `reference_id` in token ledger entries to ensure idempotent operations:

```typescript
// This will not create duplicate entries if called multiple times
await appendTokenLedgerEntry(userId, -10, 'GENERATION', jobId);
```

### Transaction Safety

Critical operations are wrapped in database transactions:

- Token deduction + job creation
- Account balance updates + ledger entries
- Multi-step generation workflows

## Database Maintenance

### Backup Strategy

```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20231026.sql
```

### Performance Monitoring

Key indexes to monitor:
- `idx_token_ledger_user_time` - Token transaction history
- `idx_generation_job_user_time` - User's generation jobs
- `idx_asset_image_user_time` - User's assets
- `idx_auth_otp_email_active` - Active OTP lookups

### Cleanup Tasks

```sql
-- Clean expired OTP entries (run daily)
DELETE FROM auth_otp 
WHERE expires_at < NOW() - INTERVAL '24 hours';

-- Archive old completed jobs (run monthly)
UPDATE generation_job 
SET status = 'ARCHIVED' 
WHERE completed_at < NOW() - INTERVAL '90 days' 
  AND status IN ('SUCCEEDED', 'FAILED');
```

## Migration and Rollback

### Running Migrations

```bash
# Apply all pending migrations
pnpm db:migrate

# Generate new migration after schema changes
pnpm db:generate
```

### Rollback Strategy

1. **Database Level**: Use transaction-wrapped migrations where possible
2. **Application Level**: Maintain backward-compatible schema changes
3. **Data Migration**: Test data transformations on staging first

### Emergency Rollback

```sql
-- Example: Emergency disable of a problematic feature
UPDATE generation_job SET status = 'PAUSED' 
WHERE status = 'QUEUED' AND created_at > '2023-10-26 12:00:00';
```

## Environment Configuration

### Required Environment Variables

```bash
# Database connection (choose one)
DATABASE_URL="postgresql://user:pass@host:port/dbname"
POSTGRES_URL="postgresql://user:pass@host:port/dbname"  # Alternative

# Optional: Connection pool settings
DB_POOL_SIZE=20
DB_TIMEOUT=30000
```

### Production Considerations

- Enable connection pooling
- Set appropriate `search_path` for schema isolation
- Configure SSL/TLS for database connections
- Monitor slow queries and optimize indexes
- Set up automated backups and point-in-time recovery

## Troubleshooting

### Common Issues

1. **Migration Failures**
   ```bash
   # Check migration status
   pnpm db:studio
   # Look at drizzle.__drizzle_migrations table
   ```

2. **Token Balance Inconsistencies**
   ```sql
   -- Verify token balance matches ledger
   SELECT 
     ta.user_id,
     ta.balance as account_balance,
     (SELECT balance_after FROM token_ledger 
      WHERE user_id = ta.user_id 
      ORDER BY occurred_at DESC LIMIT 1) as ledger_balance
   FROM token_account ta;
   ```

3. **Performance Issues**
   ```sql
   -- Check for missing indexes
   EXPLAIN ANALYZE SELECT * FROM generation_job 
   WHERE user_id = 'uuid' ORDER BY created_at DESC;
   ```

For additional support, check the application logs and database query performance metrics.