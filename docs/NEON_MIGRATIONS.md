# Neon migrations (main branch)

## Migrations on main at deploy time (Vercel)

In `package.json`, the build runs **`pnpm db:migrate`** first, then `next build`. On Vercel, when deploying **Production** (main), the **`DATABASE_URL`** (or **`POSTGRES_URL`**) from the project’s environment is used – **it must be the Neon connection string for the main branch**. Then every deploy runs migrations against the main database.

## Running migrations on main locally

1. In Neon, open the **main** branch and copy the connection string.
2. In `.env`, set: `DATABASE_URL=<paste-main-url>` (or `POSTGRES_URL`).
3. Run: **`pnpm db:migrate`** (or **`pnpm db:migrate:main`** – same command; the script only reminds you to set DATABASE_URL).

## 1. Is migrate connecting to the right database?

- **Locally:** `.env` must contain `DATABASE_URL` or `POSTGRES_URL` – the Neon connection string for the branch you want to migrate (main or test).
- **Vercel (main):** In Settings → Environment Variables for **Production**, set `DATABASE_URL` (or `POSTGRES_URL`) to the Neon connection string **for the main branch**.

## 2. Checking in Neon

In the **Neon SQL Editor** (for the database migrate should target), run:

```sql
-- Did Drizzle record any migrations?
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at;
```

- If the `drizzle` schema or table does not exist – migrate has likely never connected to this database (e.g. different URL in env).
- If the table exists and has rows – migrate did connect; check which migrations are listed (filename column).

## 3. Bringing the database to the target state manually

If you prefer not to rely on `drizzle-kit migrate`, you can run the script **`scripts/neon-ad-clone-sync.sql`** once in the Neon SQL Editor. It will bring the `ad_clone` table to the current state (no `is_meme`/`is_meme_ad`, no `is_good`). Columns: `id`, `workflow_id`, `storage_key`, `storage_url`, `created_at`.

## 4. Troubleshooting: URL is correct but main branch doesn’t change

If `DATABASE_URL` points to Neon main and `pnpm db:migrate` says “migrations applied successfully”, but the main branch in the Neon UI doesn’t get new columns/tables:

**A) Use the direct connection string for migrations**

In the Neon dashboard, when you copy the connection string, choose **“Direct connection”** (not “Pooled”). Some schema changes (DDL) need a direct connection. Replace `DATABASE_URL` in `.env` with that direct URL and run `pnpm db:migrate` again.

**B) Confirm what migrate actually did on main**

In Neon SQL Editor **on the main branch**, run:

```sql
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at;
```

Check if the latest migration (e.g. `0015_add_ad_clone_is_good`) appears. If it doesn’t, migrate either didn’t run against this database or didn’t record it (e.g. wrong branch in the URL). If it does appear but the table still has no new column, run the migration SQL by hand once (see below).

**C) Apply the missing change by hand on main**

In Neon SQL Editor on **main**, run the contents of the migration file that adds the column, e.g. to remove `is_good`:

```sql
ALTER TABLE "public"."ad_clone" DROP COLUMN IF EXISTS "is_good";
```
