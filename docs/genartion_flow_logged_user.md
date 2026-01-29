


## 1. Key Tables Used

Only the tables relevant to this flow are listed here.

### `user`
Standard authenticated user.

### `brand`
Static / core brand data.

Important columns:

- `id UUID PK`
- `user_id UUID`
- `name text`
- `website_url text`
- `language text`
- `fonts jsonb`
- `colors text[]`
- `photos text[]` – product / brand photos (blob URLs)
- `hero_photos text[]`
- `logo_url text`
- `website_data_url text` – blob with crawled pages JSON

### `brand_insights` (or `brand` insight columns if still merged)

Dynamic / marketing insight data:

- `brand_id UUID PK/FK`
- `industry text`
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
- `marketing_brief text`
- `reddit_*` jsonb fields (desires, pain_points, etc.)

### `ad_archetype`

Static catalog of ad archetypes (Problem-Solution, Testimonial, etc.):

- `code text PK` – e.g. `problem_solution`
- `display_name text`
- `description text`

### `ad_workflow`

Mapping between archetypes and concrete n8n workflows:

- `id UUID PK`
- `archetype_code text FK → ad_archetype(code)`
- `workflow_uid text` – n8n workflow ID
- `variant_key text` – e.g. `v1`, `square`
- `format text` – e.g. `square`, `16_9`
- `is_active boolean`

### `generation_job`

Central record for one ad-generation request.

Important fields (new + existing):

- `id UUID PK`
- `user_id UUID`
- `brand_id UUID`
- `status job_status` – `QUEUED | RUNNING | COMPLETED | ERROR`
- `created_at`, `started_at`, `completed_at`
- `prompt text NULL` – optional custom prompt
- `params jsonb` – extra options
- `tokens_cost bigint`
- `ledger_id bigint` – billing
- `error_code`, `error_message`

**User choices stored per job:**

- `product_photo_urls text[]` – URLs of photos used in this job
- `product_photo_mode text` – `'brand' | 'custom' | 'mixed'`
- `archetype_code text FK → ad_archetype(code)`
- `archetype_mode text` – `'single' | 'random'`
- `format text NULL` – legacy main format (optional)
- `formats text[]` – e.g. `{'square','16_9'}`
- `selected_pain_points text[]` – pain points actually used in this job
- `insight_source text` – `'auto' | 'manual' | 'mixed'`
- `custom_photo_id uuid FK → ad_image(id)` – optional, if a single hero/custom image is uploaded
- `archetype_inputs jsonb` – archetype-specific extra params

### `ad_image`

Generated ads (and optionally product photos):

- `id UUID PK`
- `job_id UUID FK → generation_job(id)`
- `user_id UUID FK → user(id)`
- `brand_id UUID FK → brand(id)`
- `created_at timestamptz`
- `title text`
- `storage_key text` – blob key
- `public_url text` – public blob URL
- `bytes_size bigint`
- `width int`
- `height int`
- `format text` – `square`, `16_9`, etc.
- `archetypes text[]` – one or more archetype codes
- `ban_flag boolean`
- `is_deleted boolean`
- `delete_at timestamptz NULL` – planned physical deletion

### `ad_event` (analytics)

Optional, but recommended:

- `id bigserial PK`
- `created_at timestamptz`
- `user_id`, `brand_id`, `job_id`, `ad_image_id`
- `archetype_code`, `workflow_id`
- `event_type text` – `saved`, `deleted`, `restored`, …
- `event_source text` – `ui`, `api`, `cron_cleanup`, …
- `metadata jsonb`

---

## 2. High-Level Flow (Screens vs. DB)

### Step 0 – Start flow (logged-in user)

**Input:** authenticated `user_id`.

**DB actions:**

Nothing yet, user only sees a list of brands to choose from.

**Reads:**

```sql
SELECT *
FROM brand
WHERE user_id = :user_id
  AND is_deleted = false;
````

---

### Step 1 – User selects a Brand

When the brand is chosen, we **create a new `generation_job`**.

**Writes:**

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
```

Returned `job_id` is stored in frontend and will be passed to every next request and to n8n.

---

### Step 2 – Choose Product Photos

User sees two panels:

1. **Current product photos** – existing photos for this brand.
2. **Add new product photo** – upload new image(s).

#### 2.1. Show current photos

**Reads:**

```sql
SELECT photos
FROM brand
WHERE id = :brand_id;
```

These are blob URLs stored in `brand.photos`.

#### 2.2. User chooses “Current product photos”

We decide which photos will be used (e.g. all or selected subset) and **freeze them on the job**.

**Writes:**

```sql
UPDATE generation_job
SET product_photo_urls = :chosen_photo_urls,   -- text[]
    product_photo_mode = 'brand',
    updated_at = now()
WHERE id = :job_id;
```

#### 2.3. User uploads new photo(s)

Flow:

1. Frontend uploads files to **Vercel Blob** (e.g. under `brands/<brand_id>/products/...`).
2. Backend receives blob URL(s).
3. Backend optionally appends them to `brand.photos` (so they are reusable).
4. Backend **stores the selected set on the job**.

**Writes:**

```sql
UPDATE brand
SET photos = array_cat(photos, :new_photo_urls),
    updated_at = now()
WHERE id = :brand_id;
```

```sql
UPDATE generation_job
SET product_photo_urls = :selected_urls,      -- can be only new ones or mix
    product_photo_mode = 'custom',            -- or 'mixed'
    updated_at = now()
WHERE id = :job_id;
```

Optionally, each upload can also create an `ad_image` row (type `source_photo`) – but to keep it simple, product photos can live only as URLs on `brand` + `generation_job`.

---

### Step 3 – Choose Ad Archetype

Screen: `Problem-Solution`, `Testimonial`, `Competitor Comparison`, etc.

#### 3.1. Display archetypes

**Reads:**

```sql
SELECT code, display_name, description
FROM ad_archetype
ORDER BY display_name;
```

#### 3.2. User selects archetype

For a single archetype:

```sql
UPDATE generation_job
SET archetype_code = :archetype_code,   -- e.g. 'problem_solution'
    archetype_mode = 'single',
    updated_at = now()
WHERE id = :job_id;
```

For “Random” (UI option):

```sql
UPDATE generation_job
SET archetype_code = 'random',          -- or NULL if you treat it specially
    archetype_mode = 'random',
    updated_at = now()
WHERE id = :job_id;
```

Later, n8n (or backend) will choose 2 archetypes from `ad_archetype` and pass them to prompts / `archetypes` field on `ad_image`.

---

### Step 4 – Select Format

Screen: user chooses:

* `1:1` (square),
* `9:16` (landscape),
* `1:1 & 9:16` (full package).

#### 4.1. Write formats on job

Map UI choice to formats:

* `1:1` → `{'square'}`
* `9:16` → `{'16_9'}` (or `'landscape'`)
* `1:1 & 9:16` → `{'square','16_9'}`

**Writes:**

```sql
UPDATE generation_job
SET formats = :formats,   -- text[] as above
    format  = NULL,       -- optional legacy main format
    updated_at = now()
WHERE id = :job_id;
```

---

### Step 5 – Select Customer Insight (Pain Point)

Screen: list of customer pain points, plus manual input field.

#### 5.1. Fetch pain points

**Reads** (example – adjust if you have a dedicated `brand_insights` table):

```sql
SELECT customer_pain_points, ins_interesting_quotes
FROM brand_insights
WHERE brand_id = :brand_id;
```

You can render them as radio buttons or list with quotes.

#### 5.2. User chooses one or multiple pain points

Frontend sends:

* `selected_pain_points: string[]`
* `insight_source: 'auto' | 'manual' | 'mixed'`

**Writes:**

```sql
UPDATE generation_job
SET selected_pain_points = :selected_pain_points,   -- text[]
    insight_source      = :insight_source,          -- 'auto' | 'manual' | 'mixed'
    updated_at          = now()
WHERE id = :job_id;
```

Now the job holds a **frozen snapshot of text** which will be used in prompts, regardless of future changes in `brand_insights`.

---

## 3. Triggering n8n Workflow

When user clicks **“Generate”** at the end of the flow:

1. Backend **ensures job is in a valid state** (brand, photos, archetype, formats, insight set).
2. It **updates job status**:

```sql
UPDATE generation_job
SET status     = 'RUNNING',
    started_at = now()
WHERE id = :job_id;
```

3. Backend calls the main n8n webhook with `{ job_id }`.

---

## 4. What n8n Reads (per `job_id`)

n8n should fetch everything it needs in one query (or a small set of queries).

### 4.1. Example combined query

```sql
SELECT
  j.*,
  b.name              AS brand_name,
  b.website_url       AS brand_website_url,
  b.language,
  b.fonts,
  b.colors,
  b.logo_url,
  b.photos            AS brand_photos,

  bi.customer_pain_points,
  bi.key_features,
  bi.key_benefits,
  bi.ins_marketing_insight,
  bi.ins_trend_opportunity,
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
WHERE j.id = :job_id;
```

From this one row n8n gets:

* **from `generation_job`**:

  * `product_photo_urls`, `product_photo_mode`
  * `archetype_code`, `archetype_mode`
  * `formats`
  * `selected_pain_points`, `insight_source`
  * `archetype_inputs`
* **from `brand`**: name, logo, colors, fonts, etc.
* **from `brand_insights`**: deeper insights, Reddit data or brief.
* **from `ad_archetype`**: user-friendly archetype description.

n8n uses these to build prompts and control sub-workflows (`generation_branch`, etc.).

---

## 5. Writing Generated Ads Back to DB

Each image created by sub-workflow should be:

1. Uploaded to **Vercel Blob** (e.g. `ads/<job_id>/<uuid>.png`).
2. Inserted into `ad_image`.
3. Optionally logged into `ad_event`.

### 5.1. Insert `ad_image`

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
    :job_id,
    :user_id,
    :brand_id,
    :title,
    :storage_key,
    :public_url,
    :bytes_size,
    :width,
    :height,
    :format,               -- e.g. 'square' or '16_9'
    :archetypes,           -- text[]: {'problem_solution'}, or {'problem_solution','value_proposition'} for Random
    false,
    false,
    NULL
)
RETURNING id;
```

### 5.2. Log analytics event (optional)

```sql
INSERT INTO ad_event (
    user_id,
    brand_id,
    job_id,
    ad_image_id,
    archetype_code,
    workflow_id,
    event_type,
    event_source,
    metadata
) VALUES (
    :user_id,
    :brand_id,
    :job_id,
    :ad_image_id,
    :archetype_code,       -- main archetype
    :workflow_id,          -- from ad_workflow.id
    'generated',
    'n8n',
    jsonb_build_object(
        'formats', :formats,
        'product_photo_mode', :product_photo_mode
    )
);
```

### 5.3. Mark job as completed / error

On successful generation of all branches:

```sql
UPDATE generation_job
SET status       = 'COMPLETED',
    completed_at = now()
WHERE id = :job_id;
```

On failure:

```sql
UPDATE generation_job
SET status       = 'ERROR',
    error_code   = :error_code,
    error_message= :error_message,
    completed_at = now()
WHERE id = :job_id;
```

---

## 6. Frontend: Showing Generated Ads

After generation, frontend either:

* polls `/api/jobs/:job_id` or
* uses websocket / SSE.

### 6.1. Fetch job status + ads

**Reads:**

```sql
SELECT *
FROM generation_job
WHERE id = :job_id;
```

If `status = 'COMPLETED'`:

```sql
SELECT *
FROM ad_image
WHERE job_id = :job_id
  AND is_deleted = false
ORDER BY created_at ASC;
```

These images are displayed on the final screen.

---

## 7. Summary

* **All user choices** during the logged-in ad flow are captured on **`generation_job`**:

  * brand (`brand_id`)
  * used photos (`product_photo_urls`, `product_photo_mode`)
  * archetype (`archetype_code`, `archetype_mode`)
  * formats (`formats`)
  * insight (`selected_pain_points`, `insight_source`)
  * advanced options (`archetype_inputs`, `prompt`)
* `brand` + `brand_insights` provide reusable, long-lived brand DNA and marketing context.
* `ad_archetype` and `ad_workflow` define the structure of archetypes and how they map to workflows.
* `n8n` receives only `job_id` and pulls everything from the DB.
* Generated assets are stored as **`ad_image`** rows and optionally tracked in `ad_event`.

This architecture gives:

* full reproducibility (you can re-create any job from DB state),
* clear separation between static brand data and per-job decisions,
* easy extension for future features (more formats, archetype options, A/B testing, advanced analytics).

```
```
