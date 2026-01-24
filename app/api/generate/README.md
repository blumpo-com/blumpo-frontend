# Generate API Routes

API routes for the free ad generation flow.

## Routes

### `route.ts` - Main Generation Endpoint

**Path**: `POST /api/generate`

**Purpose**: Initiates ad generation and waits for callback completion.

**Request Body**:
```typescript
{
  url: string;  // Website URL to generate ads for
}
```

**Response**:
```typescript
{
  status: 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  job_id: string;
  images?: AdImage[];
  error_message?: string;
}
```

**Error Codes**:
- `AUTH_REQUIRED` (401) - User not authenticated
- `INSUFFICIENT_TOKENS` (402) - User doesn't have enough tokens
- `TIMEOUT` - Generation took longer than MAX_WAIT_TIME (7 minutes)

**Flow**:
1. Validates user authentication
2. Checks if user has enough tokens (50 tokens per generation)
3. Finds or creates brand for website URL
4. Creates generation job with status 'QUEUED'
5. Deducts tokens from user account
6. Sends webhook to n8n workflow
7. Waits for callback via `waitForCallback()` (uses Redis in production, in-memory in dev)
8. Updates job status based on callback result
9. Returns job status and images

**Dependencies**:
- `@/lib/db/queries` - Database queries
- `@/lib/api/callback-waiter` - Callback waiting mechanism

**Constants**:
- `TOKENS_COST_PER_GENERATION = 50`
- `MAX_WAIT_TIME = 7 * 60 * 1000` (7 minutes)
- `WEBHOOK_TIMEOUT = 30000` (30 seconds)

**Environment Variables**:
- `N8N_WEBHOOK_URL` - Base URL for n8n webhooks
- `N8N_WEBHOOK_KEY` - API key for n8n webhooks

### `callback/route.ts` - Callback Endpoint

**Path**: `POST /api/generate/callback`

**Purpose**: Receives callbacks from n8n workflow when generation completes.

**Request Body**:
```typescript
{
  job_id: string;
  status: 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  result?: {
    images?: Array<{
      publicUrl: string;
      storageKey: string;
      width: number;
      height: number;
      format: string;
      title?: string;
    }>;
    error_message?: string;
  };
}
```

**Response**:
```typescript
{
  success: boolean;
}
```

**Flow**:
1. Parses callback data (handles malformed JSON from n8n)
2. Validates job_id
3. Updates generation job status in database
4. Resolves callback promise via `resolveCallback()`
5. Returns success response

**Special Handling**:
- Robust JSON parsing to handle n8n's sometimes malformed JSON (single quotes, etc.)
- Extracts error messages from various formats

**Dependencies**:
- `@/lib/db/queries/generation` - Generation job queries
- `@/lib/db/queries/ads` - Ad image queries
- `@/lib/api/callback-waiter` - Callback resolution

### `job-images/route.ts` - Get Job Images

**Path**: `GET /api/generate/job-images?jobId={id}`

**Purpose**: Fetches all images for a completed generation job.

**Query Parameters**:
- `jobId: string` (required) - Generation job ID

**Response**:
```typescript
Array<{
  id: string;
  title: string | null;
  publicUrl: string;
  width: number | null;
  height: number | null;
  format: string;
  workflowId: string | null;
  createdAt: string;
  archetype: {
    code: string;
    displayName: string;
    description: string | null;
  } | null;
}>
```

**Flow**:
1. Validates jobId parameter
2. Fetches all ad images for the job
3. Filters out deleted/errored images
4. Fetches archetype data for each image via workflow_id
5. Returns images with archetype information

**Dependencies**:
- `@/lib/db/queries/ads` - Ad image and workflow queries

### `brand-data/route.ts` - Get Brand Data and Insights

**Path**: `GET /api/generate/brand-data?job_id={id}`

**Purpose**: Fetches brand data and insights for a generation job.

**Query Parameters**:
- `job_id: string` (required) - Generation job ID

**Response**:
```typescript
{
  brand: {
    id: string;
    name: string;
    websiteUrl: string;
    language: string;
    fonts: any;
    colors: string[];
    logoUrl: string | null;
  } | null;
  insights: {
    customerPainPoints: string[];
    targetCustomers: string[];
    customerGroups: string[];
    redditCustomerPainPoints: any;
    redditCustomerDesires: any;
  } | null;
}
```

**Flow**:
1. Validates authentication
2. Validates job_id parameter
3. Fetches generation job
4. Verifies job belongs to user
5. If no brandId: Returns null for both brand and insights
6. Fetches brand with insights
7. Returns formatted brand and insights data

**Dependencies**:
- `@/lib/db/queries` - User queries
- `@/lib/db/queries/generation` - Generation job queries
- `@/lib/db/queries/brand` - Brand and insight queries

**Authentication**: Required (user must own the job)

## Error Handling

All routes handle errors consistently:
- Authentication errors return 401
- Validation errors return 400
- Not found errors return 404
- Server errors return 500 with error message

## Related Documentation

- `docs/FREE_GENERATION_FEATURE.md` - Feature documentation
- `lib/api/callback-waiter.ts` - Callback waiting mechanism
- `app/(dashboard)/generating/README.md` - Frontend components documentation

