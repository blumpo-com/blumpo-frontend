# Quick Ads Generation Feature

This document describes how the **Quick Ads Generation** feature works in the Blumpo platform. Quick ads are pre-generated ad images that can be instantly displayed to users, eliminating wait times for ad creation.

---

## Overview

Quick Ads Generation is an automatic ad creation system that:

- **Pre-generates** ad images in batches (5 ads per format)
- **Generates** both `1:1` (square) and `9:16` (story) formats simultaneously
- **Maintains** a pool of ready-to-use ads for instant access
- **Token timing** depends on flow: **auto-generated** (paid maintenance) → tokens when ads are displayed; **manual** (user from quick-ads-generation page) → tokens deducted at generation start (like customized ads), with refund on failure
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
  - Triggers generation via `POST /api/generate/quick-ads` when job is QUEUED (or waits for callback if RUNNING)
  - Converts mixed format parameter (`1:1,9:16` or `1:1-9:16`) to `mixed` for review view
  - When navigating to ad-review-view for quick ads, appends **`&quick_ads=true`** to the URL so the review view can call mark-displayed
  - Shows `CreatingProcess` component during generation

#### Ad Review View
- **File**: `app/(dashboard)/dashboard/ad-generation/ad-review-view/page.tsx`
- **Purpose**: Displays ads for review and interaction
- **Features**:
  - Supports single format (1:1 or 9:16) and mixed format display
  - Calls `/api/quick-ads/mark-displayed` when page loads **only if** `quick_ads=true` is in the URL (so only for quick-ads flow; ad-generation page passes this when navigating from quick ads)
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
- **Response** (success):
  ```json
  {
    "job_id": "uuid",
    "status": "SUCCEEDED",
    "images": [...],
    "tokens_used": 50
  }
  ```
  (`tokens_used` only present for **manual** quick ads; auto-generated jobs do not reserve tokens here.)
- **Response** (failure, manual only): May include `tokens_refunded` (50 or 80) when tokens were reserved and then refunded (webhook error, callback FAILED/CANCELED, timeout).
- **Purpose**: Triggers generation for a QUEUED quick ads job.
- **Token behaviour**:
  - **Manual quick ads** (`job.autoGenerated === false`): Tokens are **reserved at start** (same as customized-ads): `reserveTokens()` with cost 50 (single format) or 80 (mixed). Job is updated with `tokensCost` and `ledgerId` (JOB_RESERVE). On any failure (webhook, callback FAILED/CANCELED, timeout), tokens are refunded via `refundTokens()`.
  - **Auto-generated quick ads** (`job.autoGenerated === true`): No token deduction here; tokens are deducted when ads are viewed via `/api/quick-ads/mark-displayed`.
- **Webhook**: `https://automationforms.app.n8n.cloud/webhook/quick-ads`

#### 3. Create Quick Ads Job
- **Endpoint**: `POST /api/quick-ads/create`
- **File**: `app/api/quick-ads/create/route.ts`
- **Request Body**:
  ```json
  {
    "brandId": "uuid",
    "formats": ["1:1", "9:16"],
    "autoGenerated": true
  }
  ```
  - `brandId` (required): Brand UUID.
  - `formats` (optional): Array of formats, e.g. `['1:1']`, `['9:16']`, or `['1:1', '9:16']`. Defaults to `['1:1', '9:16']`.
  - `autoGenerated` (optional): `true` for dashboard/maintenance flow (tokens when ads displayed), `false` for manual flow from quick-ads-generation page (tokens at generation start). Defaults to `true`.
- **Response**:
  ```json
  {
    "job_id": "uuid",
    "status": "QUEUED"
  }
  ```
- **Purpose**: Creates a QUEUED generation job. No tokens deducted at creation (manual jobs are charged when `/api/generate/quick-ads` runs).

#### 4. Mark Ads as Displayed
- **Endpoint**: `POST /api/quick-ads/mark-displayed`
- **File**: `app/api/quick-ads/mark-displayed/route.ts`
- **Request Body**:
  ```json
  {
    "jobId": "uuid",
    "format": "1:1"
  }
  ```
  `format` may be `"1:1"`, `"9:16"`, or `"mixed"` (or `"1:1,9:16"` / `"1:1-9:16"`).
- **Purpose**:
  - Marks selected format ads as `ready_to_display: true`
  - For single format: Deletes unused format ads from Vercel Blob and database
  - For mixed format: Marks both formats as displayed (no cleanup, keeps both formats)
  - **Token deduction**: Only when job is **charge-on-display** (`tokensCost === 0` or no `ledgerId`), i.e. auto-generated quick ads. Deducts 50 (single format) or 80 (mixed). If job already has `tokensCost > 0` and `ledgerId` (manual quick ads or customized ads), **skips deduction** but still marks ads ready and cleans up.
- **Response**:
  ```json
  {
    "success": true,
    "markedAsDisplayed": 5,
    "deleted": 5,
    "isMixedFormat": false
  }
  ```
  (`deleted` is 0 for mixed format.)

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

### Token Deduction by Flow

Quick ads use **two token flows** depending on how the job was created:

#### Auto-generated quick ads (paid user maintenance)

Jobs created with `autoGenerated: true` (default when dashboard triggers creation). Tokens are **not** taken at generation start; they are taken when the user **displays** the ads.

1. **Job Creation** (`/api/quick-ads/create` with `autoGenerated: true` or omitted):
   - **Amount**: 0 tokens
   - **Status**: Job created with `QUEUED` status

2. **Generation Start** (`/api/generate/quick-ads`):
   - **Amount**: 0 tokens
   - **Status**: Job moves from `QUEUED` to `RUNNING`
   - **No token deduction**

3. **Ads Displayed** (`/api/quick-ads/mark-displayed`):
   - **Amount**: 50 tokens (single format) or 80 tokens (mixed)
   - **When**: When user views the generated ads (e.g. ad-review-view with `quick_ads=true`)
   - **Method**: `appendTokenLedgerEntry()` with reason `'GENERATION'`
   - **Idempotent**: If job already has `tokensCost > 0` and `ledgerId`, deduction is skipped

#### Manual quick ads (user from quick-ads-generation page)

Jobs created with `autoGenerated: false`. Tokens are **reserved at generation start** (same pattern as customized ads), with **refund on failure**.

1. **Job Creation** (`/api/quick-ads/create` with `autoGenerated: false`, `formats` optional):
   - **Amount**: 0 tokens
   - **Status**: Job created with `QUEUED` status

2. **Generation Start** (`/api/generate/quick-ads`):
   - **Amount**: 50 tokens (single format) or 80 tokens (mixed), from `job.formats`
   - **When**: Before webhook is called; `reserveTokens()` with reason `JOB_RESERVE`
   - **Job updated**: `tokensCost`, `ledgerId` set
   - **On failure** (webhook error, callback FAILED/CANCELED, timeout): `refundTokens()` is called

3. **Ads Displayed** (`/api/quick-ads/mark-displayed`):
   - **Amount**: 0 (already charged)
   - **Behaviour**: Skips deduction (job has `tokensCost` and `ledgerId`), still marks ads ready and cleans up unused format

4. **Token check** (manual flow):
   - Before generation: If insufficient tokens, `POST /api/generate/quick-ads` returns 402 with `error_code: "INSUFFICIENT_TOKENS"` and `tokens_required`.

### Token Cost Summary

| Event | Auto-generated | Manual |
|-------|----------------|--------|
| Create QUEUED job | 0 | 0 |
| Start generation (`/api/generate/quick-ads`) | 0 | 50 (single) or 80 (mixed) |
| Display/view ads (`mark-displayed`) | 50 (single) or 80 (mixed) | 0 (already charged) |
| Generation failure (manual only) | — | Refund 50 or 80 |

**Note**: One generation job produces **10 ads total** (5 per format). Token cost is 50 for a single format and 80 for mixed (both formats). Tokens are charged once per job.

---

## User Availability

### Feature Availability

1. **All Users** (including FREE tier):
   - Can access quick ads generation page
   - Can generate quick ads on-demand (manual flow: tokens at generation start)
   - Must have sufficient tokens (50 for single format, 80 for mixed)
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
- Sufficient token balance (50 for single format, 80 for mixed)

**Brand Requirements**:
- Brand must be created and linked to user
- Brand should have product photos extracted
- Brand insights should be available (for better ad quality)

---

## What Happens After Generation

### Generation Flow

1. **Job Creation**:
   - QUEUED job created via `/api/quick-ads/create` (with `brandId`, optional `formats`, and `autoGenerated: true` for maintenance or `false` for manual)
   - Job status: `QUEUED`
   - No tokens deducted at creation
   - User navigated to ad generation page (with `quick_ads=true` for manual flow)

2. **Generation Trigger**:
   - Ad generation page calls `/api/generate/quick-ads` with `jobId`
   - **Manual jobs only**: Tokens reserved (50 or 80) via `reserveTokens()`; job updated with `tokensCost` and `ledgerId`. On any later failure, tokens are refunded.
   - **Auto-generated jobs**: No token deduction
   - n8n webhook triggered: `https://automationforms.app.n8n.cloud/webhook/quick-ads`
   - Job status: `QUEUED` → `RUNNING`

3. **Generation Process**:
   - n8n workflow processes job
   - Generates 10 ads (5 per format) in parallel
   - Ads saved to database with `ready_to_display: false`
   - Callback sent to `/api/generate/callback`
   - Job status: `RUNNING` → `SUCCEEDED` (or FAILED/CANCELED; manual jobs get refund in that case)

4. **User Experience**:
   - User sees `CreatingProcess` component
   - API waits for callback (event-driven, no polling)
   - When complete, automatically transitions to ad review

5. **When ads are displayed** (ad-review-view with `quick_ads=true`):
   - `/api/quick-ads/mark-displayed` is called on page load
   - **Auto-generated jobs**: Tokens deducted here (50 or 80) if not already set on job
   - **Manual jobs**: No deduction (already charged); API still marks ads ready and cleans up
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
   - **Auto-generated job** not yet paid: 50 (single) or 80 (mixed) tokens deducted when mark-displayed is called
   - **Manual job** or job already paid: 0 tokens at display (already charged at generation start or in a prior view)
   - Token check for manual flow happens at generation start; for auto flow, when marking ads as displayed
   - Idempotent: Tokens charged once per job

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
If manual (autoGenerated false): reserve tokens (50 or 80), set job.tokensCost & ledgerId
If auto-generated: no tokens
    ↓
Job status: QUEUED → RUNNING
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
User views ads in review page (URL has quick_ads=true)
    ↓
POST /api/quick-ads/mark-displayed { jobId, format } (called on page load when quick_ads=true)
    ↓
If job charge-on-display (tokensCost 0): deduct 50 or 80 tokens. If already charged: skip deduction. Always mark ads ready and cleanup.
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
   - **Auto-generated jobs**: No tokens to refund (none were deducted)
   - **Manual jobs**: Tokens are refunded (they were reserved at generation start)
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
✅ **Cost Efficient**: 50 tokens (single format) or 80 (mixed) for 10 ads (5 per format)  
✅ **Format Flexible**: Generate both formats, use one, discard other  
✅ **Automatic Maintenance**: Paid users get background generation (charge when ads displayed)  
✅ **Smart Cleanup**: Unused formats automatically removed  
✅ **Token Safety**: Auto-generated jobs charge when ads are displayed; manual jobs charge at generation start with refund on failure  

**Key Points**:
- **Token cost**: 50 (single format) or 80 (mixed). One job produces 10 ads total (5 per format).
- **Auto-generated quick ads**: Tokens deducted when ads are **displayed** (mark-displayed).
- **Manual quick ads**: Tokens reserved at **generation start** in `/api/generate/quick-ads`, refund on failure; mark-displayed does not deduct, only marks ready and cleans up.
- Idempotent: Tokens charged once per job (manual at start; auto when displayed).
- All users can use; paid users get auto maintenance (charge-on-display).
- Unused format ads are deleted when single format is selected (mixed format keeps both).
- Dedicated webhook: `https://automationforms.app.n8n.cloud/webhook/quick-ads`
- **Automatic recovery**: Failed jobs with partial ads are automatically migrated to other jobs
- **WorkflowId pairing**: Mixed format ensures ads with the same `workflowId` are displayed together
- **Ad-review and mark-displayed**: Only called when URL has `quick_ads=true` (set by ad-generation page when navigating for quick ads)

---

## Architecture Notes

### Separation from Customized Ads

Quick ads generation uses a separate API route (`/api/generate/quick-ads`) from customized ads (`/api/generate/customized-ads`). Token timing depends on quick-ads flow:

- **Quick Ads – auto-generated** (paid maintenance): Tokens deducted when ads are displayed (`/api/quick-ads/mark-displayed`).
- **Quick Ads – manual** (user from quick-ads-generation page): Tokens reserved at generation start in `/api/generate/quick-ads` (same pattern as customized ads), with refund on failure.
- **Customized Ads**: Tokens reserved when generation starts in `/api/generate/customized-ads`.

### Job Creation Flow

1. **Quick Ads**: `/api/quick-ads/create` → Creates QUEUED job with `autoGenerated` and optional `formats`. No tokens at creation.
2. **Customized Ads**: Job created during flow with tokens reserved when generation starts.

### Token Deduction Flow

1. **Quick Ads – auto**: `/api/quick-ads/mark-displayed` → Deducts tokens when ads viewed (charge-on-display).
2. **Quick Ads – manual**: `/api/generate/quick-ads` → Reserves tokens at generation start; mark-displayed only marks ads ready and cleans up (no deduction).
3. **Customized Ads**: `/api/generate/customized-ads` → Reserves tokens at generation start.
