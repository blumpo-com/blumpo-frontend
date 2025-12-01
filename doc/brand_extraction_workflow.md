
# 📘 Brand Extraction Workflow

### *How brand data is collected, enriched, and stored across main workflow and sub-workflows*

This document describes the **full lifecycle** of populating the `brand` and `brand_insights` tables from a website URL.
It outlines each extraction step, when workflows run, what gets stored, and how the system ensures consistency.

---

# 🧭 Overview

**Goal:**
Given a website URL and a user, the system should:

1. Find or create a brand.
2. Extract raw website data.
3. Store raw HTML/crawled bundle in Vercel Blob.
4. Trigger subworkflows (fonts, colors, logo, hero, insights).
5. Update extraction status tables.
6. Aggregate results and finalize brand.
7. Hand over to generation workflows.

Everything is orchestrated in **N8N** with Postgres as the source of truth.

---

# 🔁 High-Level Workflow

```
Main Workflow
 ├─ Step 1: Get or Create Brand
 ├─ Step 2: Ensure Extraction Status Record Exists
 ├─ Step 3: Download website HTML
 ├─ Step 4: Upload raw HTML/ZIP to Vercel Blob
 ├─ Step 5: Trigger Subworkflows (parallel)
 │     ├ Fonts Extraction
 │     ├ Color Palette Extraction
 │     ├ Logo Detection
 │     ├ Hero Image Extraction
 │     ├ Insights Extraction (LLM + Reddit later)
 │
 ├─ Step 6: Poll Until All Subworkflows Complete
 ├─ Step 7: Aggregate Extracted Data
 ├─ Step 8: Continue to Image Generation Workflow
```

---

# 🧩 Step–by–Step Description

---

## **STEP 1 — Get or Create Brand**

### SQL logic

1. Try to find an existing brand matching:

   * `user_id`
   * `website_url`

2. If not found → insert a new brand:

   * `id` = `gen_random_uuid()`
   * `name` = derived from domain (e.g. "monday")
   * `website_url` = original URL
   * default values for fonts, colors, photos, hero_photos
   * `language = 'en'`

3. Always return:

   * brand record
   * booleans `need_fonts`, `need_colors`, `need_hero`, `need_logo`, `need_insights`
   * extraction status record joined (`brand_extraction_status`)

### Result example

```json
{
  "brand_id": "9ef8a4c2-9dd4-4eaa-8ae1-52e25fd0dd55",
  "need_fonts": true,
  "need_colors": true,
  "need_hero": true,
  "need_logo": true,
  "need_insights": true
}
```

The workflow decides which subworkflows must run based on the `need_*` flags and extraction status.

---

## **STEP 2 — Ensure Extraction Status Exists**

The table `brand_extraction_status` tracks each extraction:

```sql
INSERT INTO brand_extraction_status (brand_id)
VALUES (:brand_id)
ON CONFLICT (brand_id) DO NOTHING;
```

Ensures this row **always exists**.

---

## **STEP 3 — Download & Crawl Website HTML**

A dedicated block:

* fetches website HTML
* optionally fetches multiple pages (e.g. homepage, pricing, features)
* extracts:

  * HTML markup
  * inlined styles
  * external stylesheet URLs
  * script tags
  * `<img>` tags
  * computed styles (optional)
* outputs a ZIP or JSON bundle

This raw data is **not saved in the brand**, but uploaded to Vercel Blob.

---

## **STEP 4 — Save Raw HTML Snapshot to Vercel Blob**

After collecting the HTML content from one or multiple pages, the workflow must store a complete website snapshot in **a single JSON file** inside Vercel Blob.
This file becomes the canonical source for downstream extractions (fonts, colors, logo, insights, etc.).

### 📄 File path (stored in `brand.website_data_url`)

```
brands/<brand_id>/website_data.json
```

### 📦 File structure

```json
{
  "brandId": "9ef8a4c2-9dd4-4eaa-8ae1-52e25fd0dd55",
  "rootUrl": "https://monday.com",
  "crawledAt": "2025-01-10T14:30:00.000Z",
  "pages": [
    {
      "path": "/",
      "url": "https://monday.com/",
      "title": "monday.com | The Work OS",
      "html": "<!doctype html> ...",
      "status": 200
    },
    {
      "path": "/pricing",
      "url": "https://monday.com/pricing",
      "title": "Pricing",
      "html": "<!doctype html> ...",
      "status": 200
    }
  ]
}
```

### 📁 Suggested blob structure

```
brands/
  <brand_id>/
    website_data.json       ← main crawled snapshot
    fonts/                  ← extracted font previews / debug images
    colors/                 ← optional palette data
    logos/                  ← detected logos
    hero/                   ← hero banners
```

### 🗄 Update the database after upload

```sql
UPDATE brand
SET website_data_url = '<vercel_blob_url>',
    updated_at = now()
WHERE id = :brand_id;
```


---

# 🧵 STEP 5 — Trigger Subworkflows in Parallel

Based on `need_*` flags, the main workflow launches the following subworkflows:

---

## **Subworkflow A — Fonts Extraction**

**Input:**

* brand_id
* website_data_url
* crawled HTML content

**Output:**

* JSON array of `{ fontFamily, count }`

**DB Update:**

```sql
UPDATE brand
SET fonts = :jsonb_fonts_array
WHERE id = :brand_id;

UPDATE brand_extraction_status
SET fonts_status = 'ok',
    fonts_error = NULL
WHERE brand_id = :brand_id;
```

---

## **Subworkflow B — Colors Extraction**

Extract dominant and palette colors.

**Output example:**

```json
["#6161FF", "#FFD966", "#2C2C2C"]
```

**DB Update:**

```sql
UPDATE brand
SET colors = :color_array
WHERE id = :brand_id;

UPDATE brand_extraction_status
SET colors_status = 'ok'
WHERE brand_id = :brand_id;
```

---

## **Subworkflow C — Logo Extraction**

Possible methods:

* detect `<img alt="logo">`
* find SVGs in header
* use vision AI to detect logos

**DB Update:**

```sql
UPDATE brand
SET logo_url = :vercel_blob_logo_link
WHERE id = :brand_id;
```

---

## **Subworkflow D — Hero Image Extraction**

Detect hero banners or prominent images.

**DB Update:**

```sql
UPDATE brand
SET hero_photos = :array_of_urls
WHERE id = :brand_id;
```

---

## **Subworkflow E — Insights Extraction**

Uses:

* LLM analysis
* Raw HTML summarization
* Possibly Reddit mining

Writes into **brand_insights**, not `brand`.

**DB Update:**

```sql
UPDATE brand_insights
SET
  customer_pain_points = :array,
  ins_trigger_events = :array,
  ins_aspirations = :array,
  ins_interesting_quotes = :array,
  ins_marketing_insight = :text,
  ins_trend_opportunity = :text,
  ins_raw = :jsonb,
  product_description = :text,
  marketing_brief = :text
WHERE brand_id = :brand_id;
```

All *volatile* marketing data goes here.

---

# 🔄 STEP 6 — Poll Until All Subworkflows Are Finished

A separate loop workflow checks:

```sql
SELECT
  fonts_status,
  colors_status,
  hero_status,
  logo_status,
  insights_status
FROM brand_extraction_status
WHERE brand_id = :brand_id;
```

Rules:

* If all statuses ∈ {`ok`, `error`, `not_found`} → proceed
* If any status is `pending` → wait and retry

This allows missing-data cases (e.g., no heroimage found) without killing the workflow.

---

# 📦 STEP 7 — Aggregate Extracted Data

The main workflow fetches:

```sql
SELECT *
FROM brand
JOIN brand_insights USING (id or brand_id)
WHERE brand.id = :brand_id;
```

What is aggregated:

* fonts → pick most popular
* colors → extract primary brand color
* hero_photos → select the best candidate
* logo_url → ensure exists or handle fallback
* insights → merged summary for final generation

Workflow creates a final JSON payload:

```json
{
  "brand": { ...core data... },
  "insights": { ...marketing insights... },
  "assets": {
    "fonts": [...],
    "colors": [...],
    "logo": "...",
    "hero": "...",
    "photos": [...]
  }
}
```

This payload goes to the image generation phase.

---

# 🎨 STEP 8 — Pass to Generation Workflow

From aggregated brand data:

1. Create `generation_job`
2. Fetch all active archetypes
3. Create `generation_branch` for each archetype
4. Trigger generation subworkflows
5. Store generated images in Vercel Blob
6. Store metadata in `asset_image`

---

# ✔ Summary of the Whole Logic

| Step | Action                       | Table Updated                                        |
| ---- | ---------------------------- | ---------------------------------------------------- |
| 1    | Get or create brand          | `brand`                                              |
| 2    | Ensure extraction status     | `brand_extraction_status`                            |
| 3    | Crawl website HTML           | —                                                    |
| 4    | Save raw HTML to Vercel Blob | `brand.website_data_url`                             |
| 5    | Run subworkflows             | multiple tables                                      |
| 5A   | Fonts                        | `brand.fonts`                                        |
| 5B   | Colors                       | `brand.colors`                                       |
| 5C   | Logo                         | `brand.logo_url`                                     |
| 5D   | Hero photos                  | `brand.hero_photos`                                  |
| 5E   | Insights                     | `brand_insights.*`                                   |
| 6    | Poll until done              | `brand_extraction_status`                            |
| 7    | Aggregate results            | no DB writes                                         |
| 8    | Start generation pipeline    | `generation_job`, `generation_branch`, `asset_image` |
