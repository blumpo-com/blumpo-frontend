# 📘 Database Schema Documentation

This document describes the full PostgreSQL schema for the application, including all tables, relationships, and example records. The system supports:

* User authentication & accounts
* Token-based subscription system
* Brand management
* Brand insights & marketing intelligence
* Ad archetypes & workflow management
* Content & image generation pipelines
* Job orchestration with product photos, formats, and insights
* Ad analytics & event tracking
* File storage references (Vercel Blob)
* Brand extraction workflow tracking

---

# 🏛 Overview of Core Entities

```
user ────┐
         │
         ├── 1:1 ─── token_account
          │
         │ 1:N
          ▼
       brand ─── 1:1 ─── brand_insights
         │              │
         │              └── 1:1 ─── brand_extraction_status
          │
          │ 1:N
          ▼
  generation_job ─── 1:N ─── ad_image
         │
         ├── N:1 ─── ad_archetype
         │
         └── N:1 ─── ad_workflow (via ad_image.workflow_id)

ad_archetype ─── 1:N ─── ad_workflow
ad_image ─── N:1 ─── ad_workflow
ad_image ─── 1:N ─── ad_event
generation_job ─── 1:N ─── ad_event

token_ledger (audit trail for token_account)
subscription_plan (static config)
topup_plan (static config)
generation_pricing (static config)
auth_otp (one-time passwords)
```

---

# 📂 TABLE: `public.user`

**Purpose:**
Stores application users. Each user can own multiple brands and has a token account.

| Column        | Type        | Description                    |
| ------------- | ----------- | ------------------------------ |
| id            | uuid PK     | User ID                        |
| email         | text UNIQUE | User email (case-insensitive)  |
| display_name  | text        | User's display name            |
| photo_url     | text        | Profile photo URL              |
| phone_number  | text        | Optional phone number          |
| created_at    | timestamptz | Account creation date          |
| last_login_at | timestamptz | Last login timestamp           |
| ban_flag      | boolean     | Account ban status (default: false) |

**Example:**

```json
{
  "id": "4b0fd8af-638d-4158-92d3-444a90f26417",
  "email": "john@example.com",
  "display_name": "John Doe",
  "photo_url": "https://example.com/photo.jpg",
  "phone_number": null,
  "created_at": "2025-01-10T10:20:00Z",
  "last_login_at": "2025-01-15T14:30:00Z",
  "ban_flag": false
}
```

---

# 📂 TABLE: `public.token_account`

**Purpose:**
1:1 relationship with user. Tracks token balance, subscription plan, and Stripe integration.

| Column                  | Type                | Description                                    |
| ----------------------- | ------------------- | ---------------------------------------------- |
| user_id                 | uuid PK FK → user   | User reference                                 |
| balance                 | bigint              | Current token balance (default: 0)             |
| plan_code               | text FK → subscription_plan | Current subscription plan (default: 'FREE') |
| period                  | subscription_period enum | Billing period: MONTHLY / YEARLY (default: MONTHLY) |
| last_refill_at          | timestamptz         | Last token refill timestamp                    |
| next_refill_at          | timestamptz         | Next scheduled refill                          |
| stripe_customer_id      | text UNIQUE         | Stripe customer ID (nullable)                 |
| stripe_subscription_id  | text UNIQUE         | Stripe subscription ID (nullable)              |
| stripe_product_id       | text                | Stripe product ID                              |
| stripe_price_id         | text                | Stripe price ID                                |
| subscription_status     | text                | Subscription status from Stripe               |
| cancellation_time       | timestamptz         | When subscription was cancelled                |

**Indexes:**
- Unique index on `stripe_customer_id` (where not null)
- Unique index on `stripe_subscription_id` (where not null)

**Example:**

```json
{
  "user_id": "4b0fd8af-638d-4158-92d3-444a90f26417",
  "balance": 1250,
  "plan_code": "PRO",
  "period": "MONTHLY",
  "last_refill_at": "2025-01-01T00:00:00Z",
  "next_refill_at": "2025-02-01T00:00:00Z",
  "stripe_customer_id": "cus_abc123",
  "stripe_subscription_id": "sub_xyz789",
  "subscription_status": "active"
}
```

---

# 📂 TABLE: `public.token_ledger`

**Purpose:**
Audit trail for all token transactions. Immutable record of token changes.

| Column        | Type                | Description                                    |
| ------------- | ------------------- | ---------------------------------------------- |
| id            | bigserial PK        | Ledger entry ID                                |
| user_id       | uuid FK → user      | User reference                                 |
| occurred_at   | timestamptz         | Transaction timestamp (default: now())         |
| delta         | bigint              | Token change (positive = credit, negative = debit) |
| reason        | text                | Transaction reason (GENERATION, MONTHLY_REFILL, PURCHASE, etc.) |
| reference_id  | text                | Reference to related entity (e.g., job_id)     |
| balance_after | bigint              | Balance after this transaction                 |

**Indexes:**
- Index on `(user_id, occurred_at DESC)` for user history queries
- Unique index on `(reason, reference_id)` where `reference_id IS NOT NULL` for idempotency

**Example:**

```json
{
  "id": 12345,
  "user_id": "4b0fd8af-638d-4158-92d3-444a90f26417",
  "occurred_at": "2025-01-15T10:30:00Z",
  "delta": -20,
  "reason": "GENERATION",
  "reference_id": "0faee3e7-d80f-4cc6-a69a-9034a0af9a41",
  "balance_after": 1230
}
```

---

# 📂 TABLE: `public.subscription_plan`

**Purpose:**
Static configuration table for subscription plans.

| Column            | Type        | Description                          |
| ----------------- | ----------- | ------------------------------------ |
| plan_code         | text PK     | Unique plan identifier (e.g., 'FREE', 'PRO') |
| display_name      | text        | Human-readable plan name             |
| monthly_tokens    | bigint      | Tokens granted per month              |
| description       | jsonb       | Plan features/description array      |
| stripe_product_id | text UNIQUE | Stripe product ID (nullable)          |
| is_active         | boolean     | Whether plan is available (default: true) |
| is_default        | boolean     | Default plan for new users (default: false) |
| sort_order        | integer     | Display order (default: 100)          |
| rollover_cap      | bigint      | Maximum tokens that can roll over     |
| created_at        | timestamptz | Creation timestamp                    |
| updated_at        | timestamptz | Last update timestamp                |

**Indexes:**
- Unique index on `is_default` where `is_default = true` (ensures single default)
- Index on `(is_active, sort_order)` for listing active plans

---

# 📂 TABLE: `public.topup_plan`

**Purpose:**
Static configuration table for one-time token top-up purchases.

| Column            | Type        | Description                          |
| ----------------- | ----------- | ------------------------------------ |
| topup_sku         | text PK     | Unique SKU identifier                |
| display_name      | text        | Human-readable name                  |
| tokens_amount     | bigint      | Number of tokens in this top-up      |
| stripe_product_id | text UNIQUE | Stripe product ID (nullable)          |
| is_active         | boolean     | Whether top-up is available (default: true) |
| sort_order        | integer     | Display order (default: 100)          |
| created_at        | timestamptz | Creation timestamp                    |
| updated_at        | timestamptz | Last update timestamp                |

**Indexes:**
- Index on `(is_active, sort_order)` for listing active top-ups

---

# 📂 TABLE: `public.generation_pricing`

**Purpose:**
Static configuration table for generation pricing rules.

| Column            | Type        | Description                          |
| ----------------- | ----------- | ------------------------------------ |
| id                | bigserial PK | Pricing rule ID                      |
| name              | text        | Rule name                            |
| strategy          | text        | Pricing strategy (default: 'STATIC') |
| base_cost_tokens  | bigint      | Base token cost                      |
| rules             | jsonb       | Pricing rules configuration          |
| is_active         | boolean     | Whether rule is active (default: true) |
| version           | integer     | Rule version (default: 1)             |
| created_at        | timestamptz | Creation timestamp                   |
| updated_at        | timestamptz | Last update timestamp               |

**Indexes:**
- Unique index on `is_active` where `is_active = true` (ensures single active pricing)

---

# 📂 TABLE: `public.brand`

**Purpose:**
Stores the *core brand identity* and static assets that rarely change.
This table is lightweight for fast reads.

| Column           | Type                | Description                                 |
| ---------------- | ------------------- | ------------------------------------------- |
| id               | uuid PK             | Brand ID                                    |
| user_id          | uuid FK → user(id)  | Owner                                       |
| created_at       | timestamptz         | Created                                     |
| updated_at       | timestamptz         | Updated                                     |
| is_deleted       | boolean             | Soft delete flag (default: false)           |
| name             | text                | Brand name                                  |
| website_url      | text                | Main website domain                         |
| language         | text                | Preferred content language (default: 'en')  |
| fonts            | jsonb               | Extracted fonts (ranking/count)             |
| colors           | text[]              | Color palette extracted from website        |
| photos           | text[]              | General images extracted from the website   |
| hero_photos      | text[]              | Hero section images                         |
| logo_url         | text                | Link to logo in Vercel Blob                 |
| website_data_url | text                | Link to raw crawled HTML bundle             |

**Indexes:**
- Index on `user_id` for user's brands queries
- Unique index on `(user_id, website_url)` to prevent duplicate brands per user

**Example:**

```json
{
  "id": "9ef8a4c2-9dd4-4eaa-8ae1-52e25fd0dd55",
  "user_id": "4b0fd8af-638d-4158-92d3-444a90f26417",
  "name": "Monday",
  "website_url": "https://monday.com",
  "language": "en",
  "fonts": [
    { "fontFamily": "Poppins", "count": 22 },
    { "fontFamily": "Arial", "count": 1 }
  ],
  "colors": ["#FF5533", "#0099EE"],
  "photos": ["https://blob.vercel.com/.../photo1.jpg"],
  "hero_photos": ["https://blob.vercel.com/.../hero1.jpg"],
  "logo_url": "https://blob.vercel.com/.../logo.png",
  "website_data_url": "https://blob.vercel.com/.../monday_raw.zip"
}
```

---

# 📂 TABLE: `public.brand_insights`

**Purpose:**
Stores *dynamic*, frequently updated insight data about the brand, customers, and marketing context.

This table is updated by LLM pipelines, crawlers, and Reddit AI analysis.

| Column                      | Type                   | Description                               |
| --------------------------- | ---------------------- | ----------------------------------------- |
| brand_id                    | uuid PK FK → brand(id) | 1:1 relationship                           |
| created_at                  | timestamptz            | Created                                   |
| updated_at                  | timestamptz            | Updated                                   |
| client_ad_preferences      | jsonb                  | User preferences (future feature)         |
| industry                    | text                   | Industry classification                   |
| customer_pain_points       | text[]                 | Verified pain points                      |
| product_description         | text                   | Most accurate product description         |
| key_features                | text[]                 | Major selling points                      |
| brand_voice                 | text                   | Tone-of-voice summary                     |
| unique_value_prop           | text                   | Unique value proposition                  |
| key_benefits                | text[]                 | Important benefits                        |
| competitors                 | text[]                 | Competitors list                          |
| ins_trigger_events          | text[]                 | Events that cause customers to convert    |
| ins_aspirations             | text[]                 | Customer dreams/goals                     |
| ins_marketing_insight       | text                   | The main insight from analysis            |
| ins_trend_opportunity       | text                   | Market opportunity                        |
| ins_raw                     | jsonb                  | Raw LLM JSON dump                         |
| marketing_brief             | text                   | Summarised marketing brief                |
| reddit_customer_desires     | jsonb                  | Customer wants/desires from Reddit mining |
| reddit_customer_pain_points | jsonb                  | Reddit pain point clusters                |
| reddit_interesting_quotes   | jsonb                  | Quotes from Reddit threads                |
| reddit_purchase_triggers    | jsonb                  | Reasons users decided to buy              |
| reddit_marketing_brief      | text                   | AI-generated Reddit marketing summary    |
| target_customers            | text[]                 | Target customer personas (array)          |
| solution                    | text                   | Solution description                      |
| website_text                | text                   | Extracted text content from the brand's website |

**Example:**

```json
{
  "brand_id": "9ef8a4c2-9dd4-4eaa-8ae1-52e25fd0dd55",
  "industry": "Productivity SaaS",
  "customer_pain_points": [
    "Clunky corporate tools",
    "Slow workflow management",
    "Hard to collaborate across teams"
  ],
  "product_description": "AI work platform for managing workflows and teams.",
  "ins_trigger_events": ["New project kickoff", "Team scaling"],
  "ins_marketing_insight": "Users want lightweight alternatives to big enterprise tools.",
  "ins_trend_opportunity": "Position as a modular, AI-enhanced alternative.",
  "ins_raw": [{ "topPainPoints": ["..."], "triggerEvents": ["..."] }],
  "reddit_customer_desires": ["better workflow speed", "AI suggestions"],
  "target_customers": ["Small business owners", "Team leads", "Project managers"],
  "solution": "Streamlined workflow management with AI-powered automation",
  "website_text": "Extracted text content from the brand's website..."
}
```

---

# 📂 TABLE: `public.brand_extraction_status`

**Purpose:**
Tracks extraction workflow progress (fonts/colors/logo/hero/insights).

Maintained by N8N workflows.

| Column          | Type        | Description                      |
| --------------- | ----------- | -------------------------------- |
| id              | uuid PK     | Status record ID                 |
| brand_id        | uuid FK → brand(id) UNIQUE | Brand reference (1:1) |
| colors_status   | text        | pending / ok / error (default: pending) |
| colors_error    | text        | Error details if failed         |
| fonts_status    | text        | pending / ok / error (default: pending) |
| fonts_error     | text        | Error details if failed         |
| logo_status     | text        | pending / ok / error (default: pending) |
| logo_error      | text        | Error details if failed         |
| hero_status     | text        | pending / ok / error (default: pending) |
| hero_error      | text        | Error details if failed         |
| insights_status | text        | pending / ok / error (default: pending) |
| insights_error   | text        | Error details if failed         |
| created_at      | timestamptz | Created                          |
| updated_at      | timestamptz | Updated                          |

**Indexes:**
- Unique index on `brand_id` (ensures one status record per brand)

---

# 📂 TABLE: `public.generation_job`

**Purpose:**
Main container for a whole generation request (campaign, batch of images, multi-archetype generation). Supports the full logged-in ad creation flow with product photos, archetypes, formats, and insights. Can track external workflow execution via `workflow_ctx` for integration with external systems (e.g., n8n workflows).

| Column                | Type                | Description                           |
| --------------------- | ------------------- | ------------------------------------- |
| id                    | uuid PK             | Job ID                                |
| user_id               | uuid FK → user(id)  | User who created the job              |
| brand_id              | uuid FK → brand(id) | Brand used for generation (nullable)  |
| created_at            | timestamptz         | Job creation timestamp                |
| started_at            | timestamptz         | When job started processing           |
| completed_at          | timestamptz         | When job finished                     |
| status                | job_status enum     | QUEUED / RUNNING / SUCCEEDED / FAILED / CANCELED |
| prompt                | text                | Generation prompt (nullable)          |
| params                | jsonb               | Runtime params (width, height, steps, cfg, seed, etc.) |
| tokens_cost           | bigint              | Tokens deducted for this job          |
| ledger_id             | bigint FK → token_ledger(id) UNIQUE | Token ledger entry reference |
| error_code            | text                | Error code if failed                  |
| error_message         | text                | Error message if failed               |
| product_photo_urls    | text[]              | Array of product photo URLs           |
| product_photo_mode    | text                | Photo mode: 'brand' / 'custom' / 'mixed' (default: 'brand') |
| archetype_code        | text FK → ad_archetype(code) | Selected archetype (nullable) |
| archetype_mode        | text                | 'single' / 'random' (default: 'single') |
| formats               | text[]              | Array of output formats (e.g., ['square', 'story']) |
| selected_insights     | text[]              | Array of selected insights (pain points, benefits, etc.) |
| insight_source        | text                | 'auto' / 'manual' / 'mixed' (default: 'auto') |
| promotion_value_insight | jsonb            | Promotion value configuration (type, time, etc.). Structure: `{ promotionType: { discount?, newPrice?, freeTrial?, promoCode? }, promotionTime: { unlimited?, occasion?, onlyUntil? } }` |
| archetype_inputs      | jsonb               | Archetype-specific inputs             |
| workflow_ctx          | jsonb               | Workflow execution context for external workflows. When not empty, must contain: `execution_id`, `workflow_code`, `callback_url` (default: '{}') |

**Indexes:**
- Index on `(user_id, created_at DESC)` for user's job history
- Index on `status` for job queue queries
- Index on `(workflow_ctx->>'workflow_code')` for filtering by workflow code
- Index on `((workflow_ctx->>'execution_id')::bigint)` for filtering by execution ID

**Check Constraints:**
- `generation_job_workflow_ctx_shape_chk`: Ensures `workflow_ctx` is either empty `{}` or contains all required keys (`execution_id`, `workflow_code`, `callback_url`)

**Example:**

```json
{
  "id": "0faee3e7-d80f-4cc6-a69a-9034a0af9a41",
  "user_id": "4b0fd8af-638d-4158-92d3-444a90f26417",
  "brand_id": "9ef8a4c2-9dd4-4eaa-8ae1-52e25fd0dd55",
  "status": "RUNNING",
  "prompt": null,
  "params": {
    "width": 1024,
    "height": 1024,
    "steps": 20,
    "cfg": 7.5,
    "seed": 12345
  },
  "tokens_cost": 50,
  "product_photo_urls": ["https://blob.vercel.com/.../photo1.jpg"],
  "product_photo_mode": "brand",
  "archetype_code": "problem_solution",
  "archetype_mode": "single",
  "formats": ["square", "story"],
  "selected_insights": ["High costs", "Complex setup"],
  "insight_source": "auto",
  "promotion_value_insight": {
    "promotionType": {
      "discount": "5%",
      "newPrice": { "new": "99$", "old": "129$" },
      "freeTrial": "14 days",
      "promoCode": { "code": "WEEK10", "value": "10%" }
    },
    "promotionTime": {
      "unlimited": true,
      "onlyUntil": "Next week",
      "occasion": "Black Friday"
    }
  },
  "archetype_inputs": {},
  "workflow_ctx": {
    "execution_id": 12345,
    "workflow_code": "n8n_workflow_abc",
    "callback_url": "https://api.example.com/webhooks/generation-complete"
  }
}
```

---

# 📂 TABLE: `public.ad_archetype`

**Purpose:**
Defines ad archetypes (Problem-Solution, Testimonial, etc.) that can be used for ad generation.

| Column        | Type        | Description                    |
| ------------- | ----------- | ------------------------------ |
| code          | text PK     | Unique archetype code (e.g., 'problem_solution') |
| display_name  | text        | Human-readable name            |
| description   | text        | Archetype description          |
| created_at    | timestamptz | Creation timestamp             |
| updated_at    | timestamptz | Last update timestamp          |

**Example:**

```json
{
  "code": "problem_solution",
  "display_name": "Problem-Solution",
  "description": "Show user's pain point and how your product resolves it",
  "created_at": "2025-01-10T10:20:00Z",
  "updated_at": "2025-01-10T10:20:00Z"
}
```

---

# 📂 TABLE: `public.ad_workflow`

**Purpose:**
Stores workflow implementations for each archetype. Multiple workflows can exist for one archetype (distinguished by variant_key).

| Column         | Type                | Description                           |
| -------------- | ------------------- | ------------------------------------- |
| id             | uuid PK             | Workflow ID                           |
| archetype_code | text FK → ad_archetype(code) | Associated archetype |
| workflow_uid   | text UNIQUE         | External workflow ID (e.g., n8n) - must be unique |
| variant_key    | text                | Variant identifier (e.g., 'v1', 'square') |
| format         | text                | Output format (e.g., 'square', 'story', '16:9') |
| is_active      | boolean             | Whether workflow is active (default: true) |
| created_at     | timestamptz         | Creation timestamp                    |
| updated_at     | timestamptz         | Last update timestamp                 |

**Indexes:**
- Unique index on `(archetype_code, variant_key)` ensures one workflow per archetype variant
- Unique index on `workflow_uid` ensures each external workflow ID is unique
- Index on `archetype_code` for archetype lookups
- Index on `workflow_uid` for external workflow references

**Example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "archetype_code": "problem_solution",
  "workflow_uid": "n8n_workflow_123",
  "variant_key": "square",
  "format": "square",
  "is_active": true,
  "created_at": "2025-01-10T10:20:00Z",
  "updated_at": "2025-01-10T10:20:00Z"
}
```

---

# 📂 TABLE: `public.ad_image`

**Purpose:**
Stores generated ad images + metadata. Replaces the old `asset_image` table. Each image belongs to a generation job and is associated with a specific workflow via `workflow_id` (replaces the previous `archetypes` array column).

| Column        | Type                | Description                           |
| ------------- | ------------------- | ------------------------------------- |
| id            | uuid PK             | Image ID (default: gen_random_uuid())  |
| job_id        | uuid FK → generation_job(id) | Parent job |
| user_id       | uuid FK → user(id)  | Owner                                  |
| brand_id      | uuid FK → brand(id) | Associated brand (nullable)           |
| workflow_id   | uuid FK → ad_workflow(id) | Workflow used to generate this image (nullable) |
| created_at    | timestamptz         | Creation timestamp                     |
| title         | text                | Optional title                         |
| storage_key   | text                | Storage key (e.g., "users/{uid}/jobs/{jobId}/{imageId}.webp") |
| public_url    | text                | Public CDN URL (if available)          |
| bytes_size    | bigint              | File size in bytes                     |
| width         | integer             | Image width in pixels                  |
| height        | integer             | Image height in pixels                 |
| format        | text                | Format: WEBP / PNG / JPEG              |
| ban_flag      | boolean             | Whether image is banned (default: false) |
| error_flag    | boolean             | Whether image generation had an error (default: false) |
| error_message | text                | Error message if generation failed (nullable) |
| is_deleted    | boolean             | Soft delete flag (default: false)      |
| delete_at     | timestamptz         | Scheduled deletion timestamp (nullable) |

**Indexes:**
- Index on `(user_id, created_at DESC)` for user's image history
- Index on `job_id` for job's images queries
- Index on `brand_id` for brand's images queries
- Index on `workflow_id` for workflow-based queries

**Example:**

```json
{
  "id": "7e02acb2-bf92-4a2e-a153-83e0b1d362c3",
  "job_id": "0faee3e7-d80f-4cc6-a69a-9034a0af9a41",
  "user_id": "4b0fd8af-638d-4158-92d3-444a90f26417",
  "brand_id": "9ef8a4c2-9dd4-4eaa-8ae1-52e25fd0dd55",
  "workflow_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Problem-Solution Ad",
  "storage_key": "users/4b0fd8af.../jobs/0faee3e7.../7e02acb2....webp",
  "public_url": "https://cdn.blumpo.com/images/7e02acb2-bf92-4a2e-a153-83e0b1d362c3.webp",
  "bytes_size": 524288,
  "width": 1024,
  "height": 1024,
  "format": "WEBP",
  "ban_flag": false,
  "error_flag": false,
  "error_message": null,
  "is_deleted": false,
  "delete_at": null
}
```

---

# 📂 TABLE: `public.ad_event`

**Purpose:**
Analytics and event logging for ad interactions. Tracks user actions (saved, deleted, downloaded, etc.) and provides insights into ad performance.

| Column         | Type                | Description                           |
| -------------- | ------------------- | ------------------------------------- |
| id             | bigserial PK        | Event ID                               |
| created_at     | timestamptz         | Event timestamp                        |
| user_id        | uuid FK → user(id)  | User who triggered the event (nullable) |
| brand_id       | uuid FK → brand(id) | Associated brand (nullable)            |
| job_id         | uuid FK → generation_job(id) | Associated job (nullable) |
| ad_image_id    | uuid FK → ad_image(id) | Associated ad image (nullable) |
| archetype_code | text FK → ad_archetype(code) | Archetype used (nullable) |
| workflow_id    | uuid FK → ad_workflow(id) | Workflow used (nullable) |
| event_type     | text                | Event type: 'saved', 'deleted', 'restored', 'downloaded', 'shared', 'auto_delete' |
| event_source   | text                | Source: 'ui', 'api', 'cron_cleanup', etc. |
| metadata       | jsonb               | Additional event metadata              |

**Indexes:**
- Index on `ad_image_id` for image event queries
- Index on `job_id` for job event queries
- Index on `brand_id` for brand analytics
- Index on `user_id` for user analytics
- Index on `(event_type, created_at DESC)` for event type analysis

**Example:**

```json
{
  "id": 12345,
  "created_at": "2025-01-15T10:30:00Z",
  "user_id": "4b0fd8af-638d-4158-92d3-444a90f26417",
  "brand_id": "9ef8a4c2-9dd4-4eaa-8ae1-52e25fd0dd55",
  "job_id": "0faee3e7-d80f-4cc6-a69a-9034a0af9a41",
  "ad_image_id": "7e02acb2-bf92-4a2e-a153-83e0b1d362c3",
  "archetype_code": "problem_solution",
  "workflow_id": null,
  "event_type": "saved",
  "event_source": "ui",
  "metadata": {}
}
```

---

# 📂 TABLE: `public.auth_otp`

**Purpose:**
One-time password (OTP) challenges for email-based authentication.

| Column        | Type                | Description                                    |
| ------------- | ------------------- | ---------------------------------------------- |
| id            | uuid PK             | OTP record ID                                  |
| email         | text                | Email address (case-insensitive)               |
| user_id       | uuid FK → user(id)  | User reference (nullable, set after login)     |
| code_hash     | text                | Hashed 6-digit PIN (scrypt/argon2)             |
| purpose       | text                | LOGIN / VERIFY_EMAIL / CHANGE_EMAIL (default: LOGIN) |
| created_at    | timestamptz         | Creation timestamp                             |
| expires_at    | timestamptz         | Expiration timestamp                           |
| consumed_at   | timestamptz         | When OTP was successfully used (nullable)       |
| attempts      | integer             | Failed attempt counter (default: 0)            |
| max_attempts  | integer             | Maximum attempts allowed (default: 5)          |
| resend_count  | integer             | Number of times OTP was resent (default: 0)    |
| ip_address    | inet                | IP address for rate limiting (optional)         |
| user_agent    | text                | User agent string (optional)                   |

**Indexes:**
- Index on `email` where `consumed_at IS NULL` for active OTP lookups

**Example:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "john@example.com",
  "user_id": null,
  "code_hash": "$scrypt$...",
  "purpose": "LOGIN",
  "created_at": "2025-01-15T10:00:00Z",
  "expires_at": "2025-01-15T10:10:00Z",
  "consumed_at": null,
  "attempts": 0,
  "max_attempts": 5,
  "resend_count": 0
}
```

---

# 📂 Enums

### `job_status`

```
QUEUED
RUNNING
SUCCEEDED
FAILED
CANCELED
```

### `subscription_period`

```
MONTHLY
YEARLY
```

---

# ✅ Summary

This schema cleanly separates:

### ✔ User accounts & authentication (user, auth_otp)

### ✔ Token-based subscription system (token_account, token_ledger, subscription_plan, topup_plan, generation_pricing)

### ✔ Stable brand identity (brand)

### ✔ Dynamic, LLM-updated insights (brand_insights)

### ✔ Brand extraction workflow tracking (brand_extraction_status)

### ✔ Ad archetypes & workflows (ad_archetype, ad_workflow)

### ✔ Generation orchestration (generation_job → ad_image)

### ✔ Ad analytics & event tracking (ad_event)

### ✔ Image storage references

It is optimized for:

* Fast reads (separated core vs. insights)
* Scalable workloads
* Clear separation of concerns
* Easy evolution of insights and marketing logic
* Multi-step AI workflows
* Token-based billing and subscriptions
* Audit trails for all token transactions
* Flexible ad generation with multiple archetypes and formats
* Comprehensive analytics for ad performance tracking
