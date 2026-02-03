# Blog migration to Sanity

The blog is now powered by **Sanity**. Content is stored in your Sanity dataset; the app reads from Sanity for both the blog list and post pages.

## Environment variables

- **Required for the app (local and production):**
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
- **Required only for the migration script (writes to Sanity):**
  - `SANITY_API_WRITE_TOKEN` or `SANITY_API_TOKEN`  
  Create a token in [Sanity Manage](https://www.sanity.io/manage) → your project → **API** → **Tokens**. The token must have **create**, **update** (and **delete** if you want to replace documents). Use the **Editor** preset or a custom token with those permissions. Asset uploads require **update**. Do **not** add this token to Vercel or any client-exposed config.

Add these to `.env` (and in Vercel only the `NEXT_PUBLIC_*` and optionally `NEXT_PUBLIC_SANITY_API_VERSION`).

## Running the migration

Migration runs **locally** (or in a one-off job). It reads MDX from `content/blog/` and creates/updates post documents in your Sanity dataset.

1. Install dependencies: `pnpm install`
2. Ensure `.env` has `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `SANITY_API_WRITE_TOKEN` (or `SANITY_API_TOKEN`).
3. **Migrate one post (test):**
   ```bash
   pnpm run migrate:blog -- fast-ai-vs-strategic-ai-the-real-difference-in-b2b-advertising
   ```
   Or run with no slug to use the default test slug.
4. **Migrate all MDX posts:**
   ```bash
   pnpm run migrate:blog -- --all
   ```

After migration, open [Sanity Studio](/studio) (or your Studio URL) to see the posts. The site’s `/blog` and `/blog/[slug]` pages read from Sanity; no need to run migration on Vercel.

## Idempotency

If a post with the same `slug.current` already exists in Sanity, the script **replaces** it (createOrReplace). Re-running the migration for a slug is safe.

## New posts after migration

- **Option A:** Create and edit posts in **Sanity Studio** (`/studio`). Use the Post document type (title, slug, body, excerpt, tags, mainImage, draft, etc.).
- **Option B:** Keep using the existing MDX workflow (`scripts/new-post-macos.sh` etc.) to add files under `content/blog/`, then run the migration for the new slug (or `--all`) to push them to Sanity.

## Key files

- `scripts/migrate-blog-to-sanity.ts` – migration script
- `lib/posts-sanity.ts` – GROQ queries and types for blog list/post
- `app/blog/page.tsx` – blog index (uses Sanity)
- `app/blog/[slug]/page.tsx` – single post (Sanity + Portable Text)
- `sanity/schemaTypes/postType.ts` – Post schema (title, slug, mainImage, body, excerpt, tags, draft, ogImage, canonicalUrl, etc.)
