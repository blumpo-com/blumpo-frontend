# Quick Ads Generation Feature

This document describes how the **Quick Ads Generation** feature works in the Blumpo platform. Quick ads are pre-generated ad images that can be instantly displayed to users, eliminating wait times for ad creation.

---

## Overview

Quick Ads Generation is an automatic ad creation system that:

- **Pre-generates** ad images in batches (5 ads per format)
- **Generates** both `1:1` (square) and `9:16` (story) formats simultaneously
- **Maintains** a pool of ready-to-use ads for instant access
- **Takes tokens** when ads are displayed (not at generation time)
- **Automatically cleans up** unused format ads when a format is selected

---

## What Ads Are Generated

### Generation Details

When quick ads are generated:

1. **Format Coverage**: Both formats are always generated:
   - `1:1` (square format) - 5 ads
   - `9:16` (story format) - 5 ads
   - **Total: 10 ad images per generation job**

2. **Generation Method**: Ads are generated using:
   - Brand's product photos and assets
   - Automatic archetype selection (handled by n8n workflow)
   - Automatic insight selection from brand insights
   - Default generation parameters

3. **Storage Status**: Generated ads have:
   - `ready_to_display: false` initially (reserved for quick ads)
   - `auto_generated: true` flag on the generation job
   - Stored in Vercel Blob storage
   - Linked to user's brand (if brand selected)

### Paid User Maintenance

For **paid users** (non-FREE subscription plans):

- System maintains **20 ads minimum**:
  - **10 ads** in `1:1` format
  - **10 ads** in `9:16` format
- Maintenance happens automatically when:
  - User visits the dashboard
  - Count falls below threshold (10 per format)
  - User has an active brand selected
- Maintenance generates new ads **before** they're needed

---

## API Endpoints and Files

### Frontend Components

#### Page Component
- **File**: `app/(dashboard)/dashboard/quick-ads-generation/page.tsx`
- **Purpose**: Main UI for quick ads generation
- **Features**:
  - Format selection (1:1, 9:16, or both/mixed)
  - Checks for existing ads before generating
  - Handles mixed format by checking both formats simultaneously
  - Navigates to ad generation page on completion

#### Ad Generation Page
- **File**: `app/(dashboard)/dashboard/ad-generation/page.tsx`
- **Purpose**: Displays generated ads or generation progress
- **Quick Ads Flow**:
  - Polls job status for quick ads generation
  - Converts mixed format parameter (`1:1,9:16` or `1:1-9:16`) to `mixed` for review view
  - Shows `CreatingProcess` component during generation

#### Ad Review View
- **File**: `app/(dashboard)/dashboard/ad-generation/ad-review-view/page.tsx`
- **Purpose**: Displays ads for review and interaction
- **Features**:
  - Supports single format (1:1 or 9:16) and mixed format display
  - Automatically marks ads as displayed when page loads (for quick ads only)
  - Pairs ads by `workflowId` for mixed format to ensure matching ads stay together
  - Validates and syncs stacks to prevent workflowId mismatches
  - Uses `TinderView` component for single format
  - Uses `TinderViewMixed` component for mixed format

#### Tinder View Mixed Component
- **File**: `app/(dashboard)/dashboard/ad-generation/tinder-view-mixed.tsx`
- **Purpose**: Displays both formats side-by-side for mixed format selection
- **Features**:
  - **Synchronized swiping**: Both format stacks swipe together
  - **WorkflowId pairing**: Ensures ads with the same `workflowId` are displayed together
  - **Automatic synchronization**: When swiping one stack, finds matching `workflowId` in the other stack and advances both
  - **Validation**: Continuous monitoring via `useEffect` to detect and correct workflowId mismatches
  - Independent card animations per stack
  - Shared action buttons (delete, save, add to library)
  - Swiping one stack advances both stacks if they have matching workflowIds

#### Dashboard Page
- **File**: `app/(dashboard)/dashboard/page.tsx`
- **Purpose**: Entry point for paid user maintenance
- **Functionality**:
  - Checks paid user ad counts on page load
  - Triggers background generation if counts are low

### API Routes

#### 1. Check for Existing Quick Ads
- **Endpoint**: `GET /api/quick-ads`
- **File**: `app/api/quick-ads/route.ts`
- **Parameters**:
  - `format` (required): `'1:1'` or `'9:16'`
  - `brandId` (optional): Specific brand ID
- **Returns**:
  ```json
  {
    "hasAds": true,
    "ads": [...],
    "jobIds": [...]
  }
  ```
- **Purpose**: Checks if user has 5+ ready ads for selected format

#### 2. Generate Quick Ads
- **Endpoint**: `POST /api/generate/quick-ads`
- **File**: `app/api/generate/quick-ads/route.ts`
- **Request Body**:
  ```json
  {
    "jobId": "uuid"
  }
  ```
- **Response**:
  ```json
  {
    "job_id": "uuid",
    "status": "SUCCEEDED",
    "images": [...],
    "tokens_used": 50
  }
  ```
- **Purpose**: Triggers generation for a QUEUED quick ads job (similar to customized-ads flow)
- **Webhook**: `https://automationforms.app.n8n.cloud/webhook/quick-ads`

#### 3. Create Quick Ads Job
- **Endpoint**: `POST /api/quick-ads/create`
- **File**: `app/api/quick-ads/create/route.ts`
- **Request Body**:
  ```json
  {
    "brandId": "uuid"
  }
  ```
- **Response**:
  ```json
  {
    "job_id": "uuid",
    "status": "QUEUED"
  }
  ```
- **Purpose**: Creates a QUEUED generation job (no tokens deducted yet)

#### 4. Mark Ads as Displayed
- **Endpoint**: `POST /api/quick-ads/mark-displayed`
- **File**: `app/api/quick-ads/mark-displayed/route.ts`
- **Request Body**:
  ```json
  {
    "jobId": "uuid",
    "format": "1:1" // or "9:16" or "mixed"
  }
  ```
- **Purpose**:
  - Marks selected format ads as `ready_to_display: true`
  - For single format: Deletes unused format ads from Vercel Blob and database
  - For mixed format: Marks both formats as displayed (no cleanup, keeps both formats)
  - Deducts 50 tokens if not already deducted for this job
- **Response**:
  ```json
  {
    "success": true,
    "markedCount": 5,
    "deletedCount": 5, // 0 for mixed format
    "isMixedFormat": false,
    "tokensDeducted": 50
  }
  ```

#### 5. Check Paid User Status
- **Endpoint**: `GET /api/quick-ads/check-paid-user`
- **File**: `app/api/quick-ads/check-paid-user/route.ts`
- **Parameters**:
  - `brandId` (optional): Specific brand ID
- **Returns**:
  ```json
  {
    "isPaid": true,
    "needsGeneration": true,
    "format1x1Count": 5,
    "format9x16Count": 8,
    "needs1x1": true,
    "needs9x16": false
  }
  ```
- **Purpose**: Checks if paid user needs ad generation (maintenance)

#### 6. Migrate Failed Jobs (Manual)
- **Endpoint**: `POST /api/quick-ads/migrate-failed`
- **File**: `app/api/quick-ads/migrate-failed/route.ts`
- **Request Body** (optional):
  ```json
  {
    "jobId": "uuid" // Optional: specific job to migrate, or omit to migrate all failed jobs
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Migration completed",
    "sourceJob": {
      "id": "uuid",
      "status": "FAILED",
      "adsCount": 7
    },
    "targetJob": {
      "id": "uuid",
      "status": "QUEUED"
    },
    "migration": {
      "migrated": 8,
      "orphaned": 1
    }
  }
  ```
- **Purpose**: Manually migrate ads from failed quick ads jobs to existing or new jobs
- **Use Cases**:
  - Fix failed jobs that weren't automatically migrated
  - Re-run migration if something went wrong
  - Test migration logic

#### 7. List Failed Jobs
- **Endpoint**: `GET /api/quick-ads/migrate-failed`
- **File**: `app/api/quick-ads/migrate-failed/route.ts`
- **Returns**:
  ```json
  {
    "failedJobs": [
      {
        "id": "uuid",
        "status": "FAILED",
        "brandId": "uuid",
        "createdAt": "2024-01-01T00:00:00Z",
        "completedAt": "2024-01-01T00:05:00Z",
        "errorCode": "WEBHOOK_ERROR",
        "errorMessage": "Generation failed",
        "validAdsCount": 7,
        "canMigrate": true
      }
    ],
    "total": 1,
    "totalWithAds": 1
  }
  ```
- **Purpose**: List all failed quick ads jobs that can be migrated

### Database Queries

#### Query Functions
- **File**: `lib/db/queries/ads.ts`

**Functions**:
- `getQuickAdsForFormat(userId, brandId, format, limit)` - Retrieves available quick ads
- `markAdsAsReadyToDisplay(adImageIds)` - Marks ads as displayed
- `getQuickAdsCountByFormat(userId, brandId, format)` - Counts available ads
- `getUnusedFormatAds(jobId, selectedFormat)` - Gets ads to delete

#### Generation Queries
- **File**: `lib/db/queries/generation.ts`
- **Function**: `createGenerationJob()` - Creates job with `autoGenerated` flag

#### Quick Ads Migration Queries
- **File**: `lib/db/queries/quick-ads.ts`

**Functions**:
- `findOrCreateJobForMigration(userId, brandId)` - Finds existing job needing more ads or creates new one
- `migrateFailedJobAds(failedJobId, targetJobId)` - Migrates ads from failed job to target job
- `cleanupFailedJob(jobId)` - Marks failed job as CANCELED after migration

### Database Schema

#### New Columns

**`generation_job` table**:
- `auto_generated` (boolean, default: false) - Marks automatically generated jobs

**`ad_image` table**:
- `ready_to_display` (boolean, default: false) - Marks ads reserved for quick ads

---

## When Tokens Are Taken

### Token Deduction

Tokens are **deducted when ads are displayed**, not when generation starts. This allows users to generate ads without upfront payment, and only pay when they actually use the ads.

1. **Job Creation** (`/api/quick-ads/create`):
   - **Amount**: 0 tokens
   - **Status**: Job created with `QUEUED` status
   - **No token deduction**

2. **Generation Start** (`/api/generate/quick-ads`):
   - **Amount**: 0 tokens
   - **Status**: Job moves from `QUEUED` to `RUNNING`
   - **No token deduction** - ads are generated without payment

3. **Ads Displayed** (`/api/quick-ads/mark-displayed`):
   - **Amount**: 50 tokens per generation job
   - **When**: When user views/displays the generated ads
   - **Method**: Atomic transaction using `appendTokenLedgerEntry()`
   - **Ledger Entry**: Recorded with reason `'GENERATION'` and job ID
   - **Idempotent**: If tokens already deducted (tokensCost > 0), skip deduction

4. **Token Check** (before display):
   - If insufficient tokens: Error returned, ads not marked as displayed
   - User must top up tokens before viewing ads

### Token Cost Summary

| Event | Token Cost | When |
|-------|-----------|------|
| Create QUEUED job | 0 tokens | Job creation |
| Start generation | 0 tokens | Generation trigger |
| Display/view ads | 50 tokens | When ads are displayed |
| Display existing ads (already paid) | 0 tokens | Free (tokensCost already set) |
| Maintenance generation (paid users) | 50 tokens | When displayed (not at generation) |

**Note**: One generation job (50 tokens) produces **10 ads total** (5 per format). Tokens are only charged once per job, even if user views ads multiple times.

---

## User Availability

### Feature Availability

1. **All Users** (including FREE tier):
   - Can access quick ads generation page
   - Can generate quick ads on-demand
   - Must have sufficient tokens (50 tokens)
   - Must have an active brand

2. **Paid Users** (non-FREE subscriptions):
   - All above features
   - **Automatic maintenance** of 20 ads (10 per format)
   - Background generation when counts are low
   - Faster access to ready ads

### Requirements

**Minimum Requirements**:
- Authenticated user account
- Active brand with product photos
- Sufficient token balance (50 tokens minimum)

**Brand Requirements**:
- Brand must be created and linked to user
- Brand should have product photos extracted
- Brand insights should be available (for better ad quality)

---

## What Happens After Generation

### Generation Flow

1. **Job Creation**:
   - QUEUED job created via `/api/quick-ads/create`
   - Job status: `QUEUED`
   - No tokens deducted yet
   - User navigated to ad generation page

2. **Generation Trigger**:
   - Ad generation page calls `/api/generate/quick-ads` with `jobId`
   - No tokens deducted at this stage
   - n8n webhook triggered: `https://automationforms.app.n8n.cloud/webhook/quick-ads`
   - Job status: `QUEUED` → `RUNNING`

3. **Generation Process**:
   - n8n workflow processes job
   - Generates 10 ads (5 per format) in parallel
   - Ads saved to database with `ready_to_display: false`
   - Callback sent to `/api/generate/callback`
   - Job status: `RUNNING` → `SUCCEEDED`
   - **Still no tokens deducted** - payment happens when ads are displayed

4. **User Experience**:
   - User sees `CreatingProcess` component
   - API waits for callback (event-driven, no polling)
   - When complete, automatically transitions to ad review

5. **Token Deduction** (when ads displayed):
   - User views ads in ad review page
   - `/api/quick-ads/mark-displayed` is called automatically on page load
   - Tokens deducted (50 tokens) if not already deducted for this job
   - Ads marked as `ready_to_display: true`
   - For single format: Unused format ads cleaned up
   - For mixed format: Both formats kept (no cleanup)

### Display Flow

When user selects a format:

1. **Format Selection**:
   - User selects format (1:1, 9:16, or mixed/both)
   - System retrieves 5 ads for that format (or 5 pairs for mixed)

2. **Mixed Format Pairing**:
   - When mixed format is selected, ads are paired by `workflowId`
   - Ads with the same `workflowId` are displayed together (1:1 and 9:16 side-by-side)
   - Pairing ensures matching workflowIds are at the same index in both format arrays
   - Validation logic continuously monitors and corrects any misalignment

3. **Marking as Displayed**:
   - Selected format ads marked: `ready_to_display: true`
   - For mixed format: Both formats marked as displayed (no cleanup)
   - For single format: Unused format ads deleted from storage
   - These ads now appear in normal ad listings

4. **Cleanup** (single format only):
   - Unused format ads deleted from Vercel Blob
   - Unused ads marked as `is_deleted: true` in database
   - Only selected format ads remain accessible
   - **Note**: Mixed format keeps both formats (no cleanup)

### Using Existing Ads

If 5+ ads already exist for selected format:

1. **Instant Display**:
   - Ads retrieved immediately (no generation wait)
   - User navigated directly to ad review page
   - Selected format ads marked as displayed
   - For single format: Unused format ads cleaned up
   - For mixed format: Both formats kept, no cleanup

2. **Token Cost**:
   - If ads from a job that hasn't been paid yet: 50 tokens deducted
   - If ads from a job already paid: 0 tokens (already deducted)
   - Token check happens when marking ads as displayed
   - Idempotent: Tokens only deducted once per job

3. **Mixed Format Pairing**:
   - Ads are paired by `workflowId` when loaded
   - Matching workflowIds are placed at the same index in both format arrays
   - Ensures 1:1 and 9:16 ads with the same workflowId are displayed together
   - Validation logic continuously monitors and corrects any misalignment

### Paid User Maintenance

After maintenance check triggers generation:

1. **Background Generation**:
   - QUEUED jobs created via `/api/quick-ads/create`
   - Generation triggered via `/api/generate/quick-ads`
   - No tokens deducted during generation
   - Tokens deducted when user displays the ads
   - No user interaction required for generation

2. **Ready for Use**:
   - Generated ads available for next quick ads request
   - User gets instant access to ads
   - No wait time for ad creation

---

## Technical Flow Diagram

```
User selects format (1:1, 9:16, or mixed)
    ↓
Check /api/quick-ads?format=1:1 (or both formats for mixed)
    ↓
Has 5+ ads? → Yes → Pair ads by workflowId (mixed only) → Display ads
    ↓ No
POST /api/quick-ads/create { brandId }
    ↓
QUEUED job created (no tokens yet)
    ↓
Navigate to /dashboard/ad-generation?job_id=...&quick_ads=true&format=...
    ↓
POST /api/generate/quick-ads { jobId }
    ↓
Job status: QUEUED → RUNNING (no tokens deducted)
    ↓
n8n webhook triggered (quick-ads)
    ↓
Ads generated (target: 10 ads, 5 per format, matched by workflowId)
    ↓
Ads saved (ready_to_display: false, workflowId preserved)
    ↓
Callback to /api/generate/callback
    ↓
Job status: SUCCEEDED or FAILED
    ↓
If FAILED with partial ads:
    ↓
    Find/create job needing more ads
    ↓
    Match ads by workflowId (format pairs)
    ↓
    Migrate pairs to target job
    ↓
    Delete orphaned ads (no format pair)
    ↓
    Mark failed job as CANCELED
    ↓
User views ads in review page
    ↓
POST /api/quick-ads/mark-displayed { jobId, format } (auto-called on page load)
    ↓
50 tokens deducted (if not already paid, idempotent)
    ↓
If mixed format:
    ↓
    Mark both formats as displayed
    ↓
    Keep both formats (no cleanup)
    ↓
If single format:
    ↓
    Mark selected format as displayed
    ↓
    Delete unused format from storage
    ↓
Ads ready for use
```

---

## Key Database Operations

### Quick Ads Retrieval

```sql
SELECT ad_image.*, generation_job.*
FROM ad_image
INNER JOIN generation_job ON ad_image.job_id = generation_job.id
WHERE ad_image.user_id = ?
  AND ad_image.brand_id = ? (optional)
  AND ad_image.format = ? ('1:1' or '9:16')
  AND ad_image.ready_to_display = false
  AND ad_image.is_deleted = false
  AND generation_job.auto_generated = true
  AND generation_job.status = 'SUCCEEDED'
ORDER BY ad_image.workflow_id, ad_image.created_at DESC
LIMIT 5;
```

**Note**: Results are sorted by `workflow_id` to ensure matching pairs are grouped together for mixed format display.

### Mark as Displayed

```sql
UPDATE ad_image
SET ready_to_display = true
WHERE id IN (...selected ad IDs...);
```

### Cleanup Unused Format

```sql
-- 1. Delete from Vercel Blob (via API)
DELETE FROM blob storage WHERE path IN (...unused ad paths...);

-- 2. Mark as deleted in database
UPDATE ad_image
SET is_deleted = true
WHERE job_id = ? AND format != ?;
```

---

## WorkflowId Pairing for Mixed Format

### Overview

When displaying ads in **mixed format** (both 1:1 and 9:16 simultaneously), the system ensures that ads with the same `workflowId` are displayed together. This pairing mechanism ensures that related ads (same ad concept in different formats) stay synchronized.

### How It Works

1. **Initial Pairing** (`ad-review-view/page.tsx`):
   - When ads are loaded, they are grouped by `workflowId`
   - Ads with matching `workflowId` are placed at the same index in both format arrays
   - This ensures that `ads1_1[i]` and `ads16_9[i]` have the same `workflowId` when possible

2. **Swipe Synchronization** (`tinder-view-mixed.tsx`):
   - When a user swipes one stack, the system finds the matching `workflowId` in the other stack
   - Both stacks advance together to keep matching workflowIds aligned
   - If a matching `workflowId` is found at a different index, the other stack syncs to that index

3. **Continuous Validation**:
   - A `useEffect` hook continuously monitors the current ads in both stacks
   - If mismatched `workflowId`s are detected, the system automatically corrects the alignment
   - This prevents drift that can occur after multiple swipes or button presses

### Example

```
Initial State:
ads1_1[0] = { id: 'a1', workflowId: 'w1', format: '1:1' }
ads16_9[0] = { id: 'b1', workflowId: 'w1', format: '9:16' } ✅ Matched

User swipes 1:1 stack:
- System finds ads16_9 with workflowId 'w1'
- Both stacks advance together
- New ads with matching workflowId are displayed together
```

### Benefits

- **Consistent Experience**: Users see related ads (same concept) side-by-side
- **Automatic Recovery**: System corrects misalignment automatically
- **Smooth Interaction**: Swiping feels natural with synchronized stacks

---

## Error Handling

### Common Scenarios

1. **Insufficient Tokens**:
   - Error returned when trying to display ads
   - No tokens deducted
   - User must top up tokens before viewing ads
   - Generation can complete without tokens, but ads cannot be displayed

2. **Generation Failure**:
   - n8n workflow fails
   - No tokens to refund (none were deducted)
   - User notified of error
   - Job status: `FAILED`
   - **Automatic Recovery**: If some ads were generated before failure, they are automatically migrated to another job (see Failed Job Recovery below)

3. **No Brand Selected**:
   - Error returned
   - User must create/select brand first

4. **Network Errors**:
   - Generation continues in background
   - User can refresh page to check status
   - Job polled until completion

### Failed Job Recovery

When a quick ads generation job fails but has generated some ads (partial success), the system automatically recovers these ads:

1. **Automatic Migration**:
   - System finds an existing job that needs more ads (less than 10 per format)
   - If no such job exists, creates a new `QUEUED` job
   - Migrates ads from failed job to the target job
   - Happens automatically in the callback handler when a job fails

2. **Format Pair Matching**:
   - Ads are matched by `workflowId` to ensure format pairs (1:1 and 9:16)
   - Only complete pairs (both formats) are migrated
   - Orphaned ads (missing format pair) are deleted from Vercel Blob and marked as deleted in database

3. **Cleanup**:
   - Failed job is marked as `CANCELED` after migration
   - Migrated ads become part of the target job
   - Target job can continue to accumulate ads up to 20 total (10 per format)

4. **Manual Migration**:
   - Use `POST /api/quick-ads/migrate-failed` to manually migrate failed jobs
   - Can migrate a specific job by providing `jobId`
   - Can migrate all failed jobs by omitting `jobId`
   - Use `GET /api/quick-ads/migrate-failed` to list all failed jobs that can be migrated

**Example Scenario**:
- Job generates 7 ads (4 pairs + 1 orphaned)
- Job fails due to n8n error
- System finds existing job with 3 ads
- 4 pairs (8 ads) migrated to existing job
- 1 orphaned ad deleted
- Failed job marked as `CANCELED`
- Existing job now has 11 ads (can continue to 20)

**Manual Migration Example**:
```bash
# List failed jobs
GET /api/quick-ads/migrate-failed

# Migrate specific job
POST /api/quick-ads/migrate-failed
{ "jobId": "uuid" }

# Migrate all failed jobs
POST /api/quick-ads/migrate-failed
{}
```

---

## Maintenance Best Practices

### For Paid Users

- System automatically maintains 20 ads minimum
- Maintenance runs on dashboard visit
- Generates only when counts fall below threshold
- Background generation doesn't block user workflow

### For All Users

- Quick ads are a one-time generation (on-demand)
- Reuse existing ads when available to save tokens
- Select format carefully (unused format will be deleted)
- Ensure sufficient tokens before generating

---

## Related Documentation

- [Ad Generation Flow](./ad_generation_flow.md) - General ad generation process
- [Token System](./TOKEN_SYSTEM.md) - Token management and costs
- [Database Schema](./database_schema.md) - Schema reference for quick ads tables

---

## Summary

Quick Ads Generation provides:

✅ **Instant Access**: Pre-generated ads for immediate display  
✅ **Cost Efficient**: One token cost for 10 ads (5 per format)  
✅ **Format Flexible**: Generate both formats, use one, discard other  
✅ **Automatic Maintenance**: Paid users get background generation  
✅ **Smart Cleanup**: Unused formats automatically removed  
✅ **Token Safety**: Tokens only deducted when ads are displayed, no upfront payment  

**Key Points**:
- 50 tokens per generation (10 ads total)
- Tokens deducted when ads are **displayed**, not at generation time
- Generation can complete without tokens, but ads cannot be viewed without payment
- Idempotent: Tokens only deducted once per job (even if viewed multiple times)
- All users can use, paid users get maintenance
- Unused format ads are deleted when single format is selected (mixed format keeps both)
- Dedicated webhook: `https://automationforms.app.n8n.cloud/webhook/quick-ads`
- **Automatic recovery**: Failed jobs with partial ads are automatically migrated to other jobs
- **WorkflowId pairing**: Mixed format ensures ads with the same `workflowId` are displayed together
- **Automatic synchronization**: Stacks stay synchronized by workflowId during swiping

---

## Architecture Notes

### Separation from Customized Ads

Quick ads generation uses a separate API route (`/api/generate/quick-ads`) from customized ads (`/api/generate/customized-ads`):

- **Quick Ads**: Tokens deducted when displayed
- **Customized Ads**: Tokens reserved when generation starts

This separation allows different payment flows for different ad types.

### Job Creation Flow

1. **Quick Ads**: `/api/quick-ads/create` → Creates QUEUED job (no tokens)
2. **Customized Ads**: Job created during flow with tokens reserved immediately

### Token Deduction Flow

1. **Quick Ads**: `/api/quick-ads/mark-displayed` → Deducts tokens when ads viewed
2. **Customized Ads**: `/api/generate/customized-ads` → Reserves tokens at generation start
