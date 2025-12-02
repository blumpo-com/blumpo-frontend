
# Ad Generation Flow – DB-Centric Design (with `expected_ads`)

This document describes **how the ad generation flow should work**, focusing on:

- **when** each step happens,
- **what** is read/written to the database,
- how `expected_ads` in `generation_job` is used to coordinate **parallel generation**.

There are two main flows:

1. **FREE / anonymous users** – multiple archetypes, multiple variants.
2. **PAID / logged-in users** – one selected archetype, multiple variants.

---

## 1. Key Tables

Only the tables relevant to this flow are listed here.

### `brand`

Static / core brand data.

Used for:

- selecting which brand to generate for,
- pulling colors, fonts, photos, logo, etc.

Key columns:

- `id uuid PK`
- `user_id uuid`
- `name text`
- `website_url text`
- `language text`
- `fonts jsonb`
- `colors text[]`
- `photos text[]`
- `hero_photos text[]`
- `logo_url text`

### `brand_insights`

Brand & customer insight data (more dynamic, used for copy prompts).

Key columns:

- `brand_id uuid PK` (FK → `brand.id`)
- `product_description text`
- `customer_pain_points text[]`
- `key_features text[]`
- `key_benefits text[]`
- `competitors text[]`
- `ins_trigger_events text[]`
- `ins_aspirations text[]`
- `ins_interesting_quotes text[]`
- `ins_marketing_insight text`
- `ins_trend_opportunity text`
- `ins_raw jsonb`
- `client_ad_preferences jsonb`
- `marketing_brief text`
- `reddit_*` fields (optional advanced signals)

### `ad_archetype`

Catalog of ad archetypes.

Key columns:

- `code text PK` – e.g. `problem_solution`
- `display_name text`
- `description text`

### `ad_workflow`

Mapping of archetypes to concrete n8n workflows / variants.

Key columns:

- `id uuid PK`
- `archetype_code text FK → ad_archetype(code)`
- `workflow_uid text` – n8n workflow identifier
- `variant_key text` – e.g. `free_v1`, `paid_v3`
- `format text` – e.g. `square`, `16_9`
- `is_active boolean`

### `generation_job`

Central record for a single ad generation request.

Key columns (simplified):

- `id uuid PK`
- `user_id uuid` (nullable for anonymous/free if you decide so)
- `brand_id uuid`
- `status job_status` – `QUEUED | RUNNING | COMPLETED | ERROR`
- `created_at`, `started_at`, `completed_at`
- `prompt text NULL` – optional custom prompt
- `params jsonb` – extra options
- `tokens_cost bigint`
- `error_code text`
- `error_message text`

User configuration stored per job:

- `product_photo_urls text[]` – which images are used for this job
- `product_photo_mode text` – `'brand' | 'custom' | 'mixed'`
- `archetype_code text FK → ad_archetype(code)` – chosen archetype (PAID) or `random` / NULL (FREE)
- `archetype_mode text` – `'single' | 'random'`
- `format text NULL` – optional main format for backward compatibility
- `formats text[]` – e.g. `{'square','16_9'}`
- `selected_pain_points text[]`
- `insight_source text` – `'auto' | 'manual' | 'mixed'`
- `archetype_inputs jsonb`
- `expected_ads integer` – **how many ad images we expect to generate for this job**

### `ad_image`

Persisted ad images.

Key columns:

- `id uuid PK`
- `job_id uuid FK → generation_job(id)`
- `user_id uuid`
- `brand_id uuid`
- `created_at timestamptz`
- `title text`
- `storage_key text` – key in Vercel Blob
- `public_url text`
- `bytes_size bigint`
- `width int`
- `height int`
- `format text` – e.g. `square`, `16_9`
- `archetypes text[]` – one or more archetype codes used
- `ban_flag boolean`
- `is_deleted boolean`
- `delete_at timestamptz NULL`

---

## 2. High-Level Sequence

### 2.1. Free vs Paid overview

- **FREE user:**
  - The system decides **which archetypes and variants to use**.
  - Example: 3 archetypes * 2 variants each = **6 ads**.
  - `expected_ads` is set to **6** (or another configured value).

- **PAID user:**
  - User selects **one archetype** in the UI.
  - The system uses that archetype with multiple variants (e.g. 5).
  - `expected_ads` is set to **5** (or a dynamic value depending on plan).

In both cases:

1. Backend creates / updates `generation_job`.
2. Backend calls an n8n webhook with `job_id`.
3. The main n8n workflow:
   - reads context from DB,
   - finds which `ad_workflow` variants to use,
   - launches them in **parallel**,
   - waits until `COUNT(ad_image)` for this job reaches `expected_ads`,
   - marks `generation_job` as `COMPLETED` or `ERROR`.

---

## 3. Backend: Creating / Preparing `generation_job`

The backend (Next.js API route) is responsible for creating and configuring the job **before** calling n8n.

### 3.1. PAID user – creation & configuration

When a logged-in user starts the flow and selects all options (brand, photos, archetype, formats, insight):

1. **Create job**

```sql
INSERT INTO generation_job (
    id,
    user_id,
    brand_id,
    status,
    params,
    archetype_inputs
) VALUES (
    :job_id,
    :user_id,
    :brand_id,
    'QUEUED',
    '{}'::jsonb,
    '{}'::jsonb
);
````

2. **Update job with user choices**

* Product photos:

```sql
UPDATE generation_job
SET product_photo_urls = :photo_urls,          -- text[]
    product_photo_mode = :photo_mode,          -- 'brand' | 'custom' | 'mixed'
    updated_at          = now()
WHERE id = :job_id;
```

* Archetype (single):

```sql
UPDATE generation_job
SET archetype_code = :archetype_code,          -- e.g. 'problem_solution'
    archetype_mode = 'single',
    updated_at     = now()
WHERE id = :job_id;
```

* Formats:

```sql
UPDATE generation_job
SET formats = :formats,                        -- e.g. {'square','16_9'}
    format  = NULL,                            -- optional legacy main format
    updated_at = now()
WHERE id = :job_id;
```

* Selected insight:

```sql
UPDATE generation_job
SET selected_pain_points = :selected_pain_points,  -- text[]
    insight_source      = :insight_source,         -- 'auto' | 'manual' | 'mixed'
    updated_at          = now()
WHERE id = :job_id;
```

3. **Set expected_ads (PAID)**

Example: 5 variants:

```sql
UPDATE generation_job
SET expected_ads = 5
WHERE id = :job_id;
```

4. **Trigger n8n**

Backend calls n8n via HTTP (webhook) with payload:

```json
{
  "job_id": "..."
}
```

### 3.2. FREE user – creation & configuration

For FREE users, the backend still creates a `generation_job`, but:

* `user_id` may be NULL or a dedicated “guest” user id,
* the system chooses archetypes & variants automatically.

Example:

```sql
INSERT INTO generation_job (
    id,
    user_id,
    brand_id,
    status,
    params,
    archetype_inputs
) VALUES (
    :job_id,
    NULL,                -- or a special guest user
    :brand_id,
    'QUEUED',
    '{}'::jsonb,
    '{}'::jsonb
);
```

Then:

* set default formats (e.g. `{'square','16_9'}`),
* store any auto-selected pain points if needed,
* set `expected_ads`, e.g.:

```sql
UPDATE generation_job
SET expected_ads = 6
WHERE id = :job_id;
```

Then trigger n8n with `{ "job_id": "..." }`.

---

## 4. n8n – Main Workflow (Common Pattern)

The main workflow in n8n is responsible for:

* reading job + brand context from DB,
* deciding which `ad_workflow` rows to use,
* launching **parallel sub-workflows**,
* waiting for all ads to be generated based on `expected_ads`.

### 4.1. Step 1 – Start (Webhook)

* Input: `{ "job_id": "..." }`

### 4.2. Step 2 – Load job + brand + insights

Use a **Postgres node** with a query similar to:

```sql
SELECT
    j.*,
    b.name              AS brand_name,
    b.website_url       AS brand_website_url,
    b.language,
    b.fonts,
    b.colors,
    b.photos            AS brand_photos,
    b.hero_photos,
    b.logo_url,

    bi.product_description,
    bi.customer_pain_points,
    bi.key_features,
    bi.key_benefits,
    bi.competitors,
    bi.ins_marketing_insight,
    bi.ins_trend_opportunity,
    bi.ins_raw,
    bi.client_ad_preferences,
    bi.marketing_brief,

    a.display_name      AS archetype_display_name,
    a.description       AS archetype_description

FROM generation_job j
JOIN brand b
  ON b.id = j.brand_id
LEFT JOIN brand_insights bi
  ON bi.brand_id = b.id
LEFT JOIN ad_archetype a
  ON a.code = j.archetype_code
WHERE j.id = '{{ $json.job_id }}'::uuid;
```

This gives the main workflow **all context needed for prompt building**, regardless of FREE/PAID.

### 4.3. Step 3 – Decide `ad_workflow` variants

#### FREE mode

Logic:

* pick 3 archetypes (either from config or hard-coded),
* for each archetype, select its FREE variants (e.g. `variant_key LIKE 'free_%'`).

Example query:

```sql
SELECT *
FROM ad_workflow
WHERE archetype_code IN ('problem_solution','testimonial','competitor_compare')
  AND variant_key LIKE 'free_%'
  AND is_active = true;
```

#### PAID mode

Logic:

* take `archetype_code` from `generation_job`,
* fetch PAID variants (e.g. `variant_key LIKE 'paid_%'`),
* limit to a certain number (e.g. 5).

Example query:

```sql
SELECT *
FROM ad_workflow
WHERE archetype_code = '{{ $json.archetype_code }}'
  AND variant_key LIKE 'paid_%'
  AND is_active = true
ORDER BY variant_key
LIMIT 5;
```

Result: **one item per variant** (branch) you want to run.

### 4.4. Step 4 – Launch parallel branches

In n8n:

* Use an **Execute Workflow** (or Function + HTTP Request, etc.) node configured as:

  * `Wait Till Finished` = **false** → so execution continues without waiting, allowing true parallelism.
* The node runs **once per item** returned from the `ad_workflow` query.

For each item, pass:

* `job_id`
* `archetype_code`
* `ad_workflow_id`
* `workflow_uid`
* `format`

This triggers a **subworkflow** that handles a single branch (single ad or a small group of ads).

### 4.5. Step 5 – Mark job as RUNNING

After launching branches:

```sql
UPDATE generation_job
SET status     = 'RUNNING',
    started_at = now()
WHERE id = '{{ $json.job_id }}'::uuid;
```

### 4.6. Step 6 – Poll until `expected_ads` are generated

Use a loop in n8n (e.g. Function → Wait → Postgres) that:

1. Fetches `expected_ads`:

   ```sql
   SELECT expected_ads
   FROM generation_job
   WHERE id = '{{ $json.job_id }}'::uuid;
   ```

2. Counts generated ads:

   ```sql
   SELECT COUNT(*) AS generated
   FROM ad_image
   WHERE job_id = '{{ $json.job_id }}'::uuid
     AND is_deleted = false;
   ```

3. Compares `generated` vs `expected_ads`.

* If `generated >= expected_ads` → exit loop as success.
* If timeout / max retries is reached → exit loop with failure.

### 4.7. Step 7 – Mark job as COMPLETED or ERROR

**On success:**

```sql
UPDATE generation_job
SET status       = 'COMPLETED',
    completed_at = now()
WHERE id = '{{ $json.job_id }}'::uuid;
```

**On error (timeout or branch failure):**

```sql
UPDATE generation_job
SET status        = 'ERROR',
    error_code    = 'TIMEOUT_OR_PARTIAL',
    error_message = 'Not all branches finished in time or an error occurred',
    completed_at  = now()
WHERE id = '{{ $json.job_id }}'::uuid;
```

---

## 5. n8n – Subworkflow (Single Branch)

Each subworkflow is responsible for **one archetype + variant** and typically produces **one ad image** (or a small batch).

### 5.1. Input

Subworkflow receives:

* `job_id`
* `archetype_code`
* `ad_workflow_id`
* `workflow_uid`
* `format` (e.g. `square`, `16_9`)

### 5.2. Step 1 – Fetch job + brand context

Use the same `job_id` query as in the main workflow (or a lighter version if needed).
This ensures each branch has all necessary data even if run on a different worker.

### 5.3. Step 2 – Build prompt

In a Code node:

* combine:

  * `selected_pain_points`
  * `product_photo_urls`
  * `archetype_code` + `archetype_description`
  * `formats`
  * `brand` fields (name, product_description, key_features, competitors, marketing_brief)
  * `client_ad_preferences`, etc.
* build a clear prompt for the image model.

### 5.4. Step 3 – Call image model

* Call your LLM / image model / external API to generate the creative.
* On success, you get image data (binary or URL) plus metadata (width, height, size, etc.).

### 5.5. Step 4 – Upload to Vercel Blob

* Store the final image at a structured path, e.g.:

  ```
  ads/<job_id>/<archetype_code>/<variant_key>/<uuid>.png
  ```

* Get `storage_key` and `public_url`.

### 5.6. Step 5 – Insert `ad_image` row

```sql
INSERT INTO ad_image (
    id,
    job_id,
    user_id,
    brand_id,
    title,
    storage_key,
    public_url,
    bytes_size,
    width,
    height,
    format,
    archetypes,
    ban_flag,
    is_deleted,
    delete_at
) VALUES (
    gen_random_uuid(),
    '{{ $json.job_id }}'::uuid,
    '{{ $json.user_id }}'::uuid,
    '{{ $json.brand_id }}'::uuid,
    '{{ $json.title }}',
    '{{ $json.storage_key }}',
    '{{ $json.public_url }}',
    {{ $json.bytes_size }},
    {{ $json.width }},
    {{ $json.height }},
    '{{ $json.format }}',                 -- e.g. 'square' or '16_9'
    ARRAY['{{ $json.archetype_code }}'],  -- main archetype
    false,
    false,
    NULL
);
```

(Adjust expressions to match the actual data from the node.)

---

## 6. Frontend: Reading Results

After job creation & triggering n8n, the frontend can:

1. Poll an API endpoint like `/api/jobs/:job_id` that reads:

   ```sql
   SELECT status, error_code, error_message
   FROM generation_job
   WHERE id = :job_id;
   ```

2. Once `status = 'COMPLETED'`, fetch images:

   ```sql
   SELECT *
   FROM ad_image
   WHERE job_id = :job_id
     AND is_deleted = false
   ORDER BY created_at ASC;
   ```

3. Display ads grouped by archetype, format, etc.

---

## 7. Summary

* **Backend**:

  * creates and configures `generation_job`,
  * sets `expected_ads` depending on FREE/PAID scenario,
  * triggers n8n with `job_id`.

* **Main n8n workflow**:

  * loads `generation_job` + `brand` + `brand_insights`,
  * finds appropriate `ad_workflow` variants,
  * launches subworkflows in **parallel**,
  * uses **`expected_ads` + `COUNT(ad_image)`** to know when all ads are ready,
  * marks `generation_job` as `COMPLETED` or `ERROR`.

* **Subworkflow per branch**:

  * fetches job context,
  * builds prompts,
  * calls image model,
  * uploads to Blob,
  * inserts `ad_image` rows.

The whole system is driven by `job_id` and `expected_ads`, which makes it easy to scale the number of archetypes and variants without changing core orchestration logic.
