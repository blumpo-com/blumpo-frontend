# Ad Generation Flow – Updated DB-Centric Design  
*(Parallel Generation, no `expected_ads` in DB, with `ad_image.error_flag`)*

This document describes how the **ad generation system** works in a **database-driven** and **n8n-orchestrated** way.

The main ideas:

- Frontend/backend creates a `generation_job` (with brand, photos, archetype, etc.).
- n8n is triggered with **only**:

```json
{
  "job_id": "..."
}
````

* Inside n8n, the main workflow:

  * loads all context from the DB,
  * decides which **branches/variants** should run,
  * sets an internal `expected_outputs` value (e.g. number of branches),
  * runs subworkflows **in parallel**,
  * waits until the DB shows that all expected outputs (success or error) are written to `ad_image`.

The database is used for:

* **context resolution**
* **prompt construction**
* **saving ads (or their errors)**
* **detecting when all parallel subworkflow outputs are ready**

---

# 1. Key Tables

Only the tables relevant to the updated system are documented.

## `brand`

Static brand data (fonts, colors, product photos, logo).

Key columns:

* `id uuid PK`
* `user_id uuid`
* `name text`
* `website_url text`
* `language text`
* `fonts jsonb`
* `colors text[]`
* `photos text[]`
* `hero_photos text[]`
* `logo_url text`

## `brand_insights`

Dynamic marketing & customer insights used for prompt creation.

Key columns:

* `brand_id uuid PK`
* `product_description text`
* `customer_pain_points text[]`
* `ins_trigger_events text[]`
* `ins_aspirations text[]`
* `ins_interesting_quotes text[]`
* `ins_marketing_insight text`
* `ins_trend_opportunity text`
* `ins_raw jsonb`
* `client_ad_preferences jsonb`
* `marketing_brief text`
* various `reddit_*` fields

## `ad_archetype`

List of archetypes used in the system.

* `code text PK`
* `display_name text`
* `description text`

## `ad_workflow`

Describes which n8n workflow to use for each archetype or variant.

Columns:

* `id uuid PK` – can be **static/manual** (e.g. hard-coded UUIDs)
* `archetype_code text FK → ad_archetype(code)`
* `workflow_uid text` (n8n workflow id)
* `variant_key text` – a stable key (e.g. `v1_square`, `testimonial_16_9`)
* `format text` (e.g. `square`, `16_9`)
* `is_active boolean`

In n8n we follow this pattern:

1. **Decide** which variants should exist (e.g. list of `(id, archetype_code, variant_key, format, workflow_uid)`).
2. For each variant, **ensure the row exists** in `ad_workflow` using an UPSERT by `id` or `variant_key`.
3. Then **SELECT** all `ad_workflow` rows for the current job to drive parallel generation.

Example UPSERT by `id`:

```sql
INSERT INTO ad_workflow (id, archetype_code, workflow_uid, variant_key, format, is_active)
VALUES (
  '{{ $json.variant_id }}'::uuid,
  '{{ $json.archetype_code }}',
  '{{ $json.workflow_uid }}',
  '{{ $json.variant_key }}',
  '{{ $json.format }}',
  true
)
ON CONFLICT (id) DO NOTHING;
```

If you prefer `variant_key` as the unique identifier, add a unique index on `(archetype_code, variant_key)` and upsert on that instead.

## `generation_job`

Represents one ad generation request.

Key columns:

* `id uuid PK`
* `user_id uuid`
* `brand_id uuid`
* `status job_status` – `QUEUED | RUNNING | COMPLETED | ERROR`
* `product_photo_urls text[]`
* `product_photo_mode text` — `'brand' | 'custom' | 'mixed'`
* `archetype_code text`
* `archetype_mode text`
* `formats text[]`
* `selected_pain_points text[]`
* `insight_source text`
* `archetype_inputs jsonb`
* `error_code`, `error_message`
* `created_at`, `started_at`, `completed_at`

This table is **not** responsible for telling n8n how many outputs to expect; that is calculated inside the main workflow based on the set of variants to run.

## `ad_image`

Stores generated creatives **OR errors**.

New columns added:

* `error_flag boolean DEFAULT false`
* `error_message text NULL`

Final list:

* `id uuid PK`
* `job_id uuid`
* `user_id uuid`
* `brand_id uuid`
* `title text`
* `storage_key text`
* `public_url text`
* `width int`
* `height int`
* `format text`
* `archetypes text[]`
* `bytes_size bigint`
* `ban_flag boolean`
* `is_deleted boolean`
* `delete_at timestamptz`
* **`error_flag boolean`**
* **`error_message text`**

A failed generation branch produces an `ad_image` row with:

```text
error_flag   = true
error_message = "..."
public_url   = NULL
storage_key  = NULL
width        = NULL
height       = NULL
```

---

# 2. High-Level Flow (n8n Orchestrated)

The entire generation flow is driven by **`job_id` passed to n8n**, and by an **internal** `expected_outputs` value computed in the main workflow from the selected variants.

## Summary

1. n8n receives **only `job_id`** from the webhook.
2. The main workflow:

   * loads brand + insights + job context from DB,
   * defines which **ad variants** should be generated (list of archetype+variant_key+format+workflow_uid),
   * ensures each variant exists in `ad_workflow` (UPSERT),
   * sets an internal `expected_outputs = number_of_variants`,
   * launches **parallel subworkflow branches** (one per variant),
   * each branch writes a row into `ad_image` (success or error),
   * loops until:

     * total `ad_image` rows for `job_id` **equals `expected_outputs`**,
   * marks `generation_job` as:

     * `COMPLETED` (if at least one success, or according to your rule),
     * `ERROR` (e.g. if all variants fail or timeout).

---

# 3. Main n8n Workflow

## 3.1. Step 1 — Webhook Trigger

Input example:

```json
{
  "job_id": "29e..."
}
```

No `expected_outputs`, no mode. Those are derived inside the workflow.

---

## 3.2. Step 2 — Fetch job + brand + insights

Use a Postgres node:

```sql
SELECT
    j.*,
    b.name AS brand_name,
    b.website_url,
    b.language,
    b.fonts,
    b.colors,
    b.photos AS brand_photos,
    b.hero_photos,
    b.logo_url,
    bi.product_description,
    bi.customer_pain_points,
    bi.key_features,
    bi.key_benefits,
    bi.competitors,
    bi.ins_trigger_events,
    bi.ins_aspirations,
    bi.ins_interesting_quotes,
    bi.ins_marketing_insight,
    bi.ins_trend_opportunity,
    bi.ins_raw,
    bi.client_ad_preferences,
    bi.marketing_brief
FROM generation_job j
JOIN brand b ON b.id = j.brand_id
LEFT JOIN brand_insights bi ON bi.brand_id = b.id
WHERE j.id = '{{ $json.job_id }}'::uuid;
```

This gives **full context** for any variants.

---

## 3.3. Step 3 — Define and Ensure Branch Workflows

In this step, the main workflow:

1. **Decides which variants to run** for this job.
   For example, in a Code node:

   ```js
   // Example: 3 variants for this job
   const variants = [
     {
       variant_id: '11111111-1111-1111-1111-111111111111',
       archetype_code: 'problem_solution',
       variant_key: 'ps_square_v1',
       format: 'square',
       workflow_uid: 'n8n-workflow-ps-square-v1',
     },
     {
       variant_id: '22222222-2222-2222-2222-222222222222',
       archetype_code: 'testimonial',
       variant_key: 'testimonial_16_9_v1',
       format: '16_9',
       workflow_uid: 'n8n-workflow-testimonial-16-9-v1',
     },
     {
       variant_id: '33333333-3333-3333-3333-333333333333',
       archetype_code: 'competitor_compare',
       variant_key: 'competitor_square_v1',
       format: 'square',
       workflow_uid: 'n8n-workflow-competitor-square-v1',
     }
   ];

   // Save for downstream nodes
   return variants.map(v => ({ json: v }));
   ```

2. For each variant, **UPSERT** an `ad_workflow` row if it doesn’t exist yet:

   ```sql
   INSERT INTO ad_workflow (id, archetype_code, workflow_uid, variant_key, format, is_active)
   VALUES (
     '{{ $json.variant_id }}'::uuid,
     '{{ $json.archetype_code }}',
     '{{ $json.workflow_uid }}',
     '{{ $json.variant_key }}',
     '{{ $json.format }}',
     true
   )
   ON CONFLICT (id) DO NOTHING;
   ```

   > If you prefer `variant_key` as the uniqueness constraint, add a unique index and upsert on `(archetype_code, variant_key)` instead.

3. After upserts, you can **SELECT the final set** of `ad_workflow` rows to drive parallel generation:

   ```sql
   SELECT *
   FROM ad_workflow
   WHERE id IN (
     {{ $items().map(i => `'${i.json.variant_id}'`).join(',') }}
   );
   ```

4. In a Code node, set:

   ```js
   const workflows = $items(); // after SELECT
   // expected_outputs = number of variants we plan to run
   const expected_outputs = workflows.length;

   return workflows.map(wf => ({
     json: {
       ...wf.json,
       job_id: $node['Webhook'].json.job_id,
       expected_outputs,
     }
   }));
   ```

   From this point, every item carries `job_id` and the common `expected_outputs`.

---

## 3.4. Step 4 — Launch Parallel Subworkflows

Use:

* **Execute Workflow** node
* `Wait Till Finished = false` (true parallel)

Each item carries:

* `job_id`
* `variant_id` (or `ad_workflow.id`)
* `archetype_code`
* `variant_key`
* `format`
* `workflow_uid`
* `expected_outputs` (same number for all branches)

The Execute Workflow node calls the **subworkflow** (one creative branch).

Branches run independently and each writes **one `ad_image` row** (success or error).

---

# 4. Subworkflow: Generating a Single Creative

Each branch is responsible for producing **one creative result**.

## 4.1. Step 1 — Fetch job context again(only in paid workflows)

Using `job_id` from input:

```sql
SELECT
    j.*,
    b.name AS brand_name,
    b.website_url,
    b.language,
    b.fonts,
    b.colors,
    b.photos AS brand_photos,
    b.hero_photos,
    b.logo_url,
    bi.product_description,
    bi.customer_pain_points,
    bi.key_features,
    bi.key_benefits,
    bi.competitors,
    bi.ins_trigger_events,
    bi.ins_aspirations,
    bi.ins_interesting_quotes,
    bi.ins_marketing_insight,
    bi.ins_trend_opportunity,
    bi.ins_raw,
    bi.client_ad_preferences,
    bi.marketing_brief
FROM generation_job j
JOIN brand b ON b.id = j.brand_id
LEFT JOIN brand_insights bi ON bi.brand_id = b.id
WHERE j.id = '{{ $json.job_id }}'::uuid;
```

## 4.2. Step 2 — Build Prompt

Use a Code node to combine:

* `generation_job.product_photo_urls`
* `generation_job.formats`
* `generation_job.selected_pain_points`
* brand + insight data
* `archetype_code`, `variant_key`, `format`
* `client_ad_preferences`, `marketing_brief`

into a **single prompt** string for the image model.

## 4.3. Step 3 — Call Image Model

Call your image API:

* **on success**: receive image bytes/URL + metadata (width, height, size).
* **on error**: capture `error_message`.

## 4.4. Step 4 — Upload to Blob (success case)

Example path:

```text
ads/<job_id>/<variant_key>/<uuid>.png
```

## 4.5. Step 5 — Insert into `ad_image`

### SUCCESS branch

```sql
INSERT INTO ad_image (
    id, job_id, user_id, brand_id,
    title, storage_key, public_url,
    bytes_size, width, height, format,
    archetypes, ban_flag, is_deleted,
    delete_at, error_flag, error_message
)
VALUES (
    gen_random_uuid(),
    '{{ $json.job_id }}'::uuid,
    '{{ $json.user_id }}',
    '{{ $json.brand_id }}',
    '{{ $json.title }}',
    '{{ $json.storage_key }}',
    '{{ $json.public_url }}',
    {{ $json.bytes_size }},
    {{ $json.width }},
    {{ $json.height }},
    '{{ $json.format }}',
    ARRAY['{{ $json.archetype_code }}'],
    false,
    false,
    NULL,
    false,
    NULL
);
```

### ERROR branch

```sql
INSERT INTO ad_image (
    id, job_id, user_id, brand_id,
    title, storage_key, public_url,
    bytes_size, width, height, format,
    archetypes, ban_flag, is_deleted,
    delete_at, error_flag, error_message
)
VALUES (
    gen_random_uuid(),
    '{{ $json.job_id }}'::uuid,
    '{{ $json.user_id }}',
    '{{ $json.brand_id }}',
    '{{ $json.title }}',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{{ $json.format }}',
    ARRAY['{{ $json.archetype_code }}'],
    false,
    false,
    NULL,
    true,
    '{{ $json.error_message }}'
);
```

Each branch always writes exactly **one row** to `ad_image`.

---

# 5. Main Workflow Completion Logic (Expected Outputs Inside n8n)

The main workflow does **not** use any `expected_ads` in the DB.

Instead:

* It computes `expected_outputs = number_of_variants` in a Code node while preparing the branch list.
* It then runs a loop until the DB shows that `expected_outputs` results were written.

### Completion loop

1. Query total outputs for the job:

```sql
SELECT COUNT(*) AS total
FROM ad_image
WHERE job_id = '{{ $json.job_id }}';
```

2. Stop when:

```text
total >= expected_outputs
```

3. Optional: detect full failure (all outputs errored):

```sql
SELECT COUNT(*) FILTER (WHERE error_flag = true) AS errors,
       COUNT(*) AS total
FROM ad_image
WHERE job_id = '{{ $json.job_id }}';
```

If:

```text
total >= expected_outputs
AND errors = total
```

→ Treat job as **ERROR**.

### Update job on completion

**Success** (at least one non-error output):

```sql
UPDATE generation_job
SET status = 'COMPLETED',
    completed_at = now()
WHERE id = '{{ $json.job_id }}';
```

**Error** (all outputs failed or timeout):

```sql
UPDATE generation_job
SET status        = 'ERROR',
    error_code    = 'ALL_BRANCHES_FAILED',
    error_message = 'All creative generation attempts returned errors.',
    completed_at  = now()
WHERE id = '{{ $json.job_id }}';
```

---

# 6. Frontend Retrieval

The frontend polls:

```http
GET /api/jobs/:job_id
```

DB:

```sql
SELECT status, error_code, error_message
FROM generation_job
WHERE id = :job_id;
```

If `status = 'COMPLETED'`:

```sql
SELECT *
FROM ad_image
WHERE job_id = :job_id
  AND is_deleted = false;
```

The client can group ads by archetype, format, variant_key, etc.

---

# 7. Summary

* Webhook → **only `job_id`**
* Main workflow:

  * loads context,
  * decides variants,
  * upserts `ad_workflow` if needed,
  * sets `expected_outputs = number_of_variants`,
  * launches parallel subworkflows,
  * waits until `COUNT(ad_image)` ≥ `expected_outputs`,
  * marks `generation_job` as COMPLETED or ERROR.
* Subworkflow:

  * builds prompt,
  * calls image model,
  * uploads image (success),
  * inserts exactly one `ad_image` row (success or error).

This design is:

* Flexible (variants configured in n8n).
* DB-centric (full audit trail in `generation_job` + `ad_workflow` + `ad_image`).
* Easy to extend with new archetypes, variants, or workflows.
