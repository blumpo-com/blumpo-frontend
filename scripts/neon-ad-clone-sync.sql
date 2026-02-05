-- Uruchom w Neon SQL Editor (np. na main), żeby doprowadzić ad_clone do aktualnego stanu.
-- Idempotentne – możesz uruchomić wielokrotnie.

-- 1. Tabela ad_clone (jeśli nie istnieje)
CREATE TABLE IF NOT EXISTS "public"."ad_clone" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workflow_id" uuid NOT NULL,
  "storage_key" text NOT NULL,
  "storage_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. FK do ad_workflow (jeśli nie ma)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND constraint_name = 'ad_clone_workflow_id_ad_workflow_id_fk'
  ) THEN
    ALTER TABLE "public"."ad_clone"
    ADD CONSTRAINT "ad_clone_workflow_id_ad_workflow_id_fk"
    FOREIGN KEY ("workflow_id") REFERENCES "public"."ad_workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- 3. Indeks (jeśli nie ma)
CREATE INDEX IF NOT EXISTS "idx_ad_clone_workflow" ON "public"."ad_clone" ("workflow_id");

-- 4. Usuń stare kolumny (is_meme / is_meme_ad) i indeks
DROP INDEX IF EXISTS "public"."idx_ad_clone_meme";
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ad_clone' AND column_name = 'is_meme') THEN
    ALTER TABLE "public"."ad_clone" DROP COLUMN "is_meme";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ad_clone' AND column_name = 'is_meme_ad') THEN
    ALTER TABLE "public"."ad_clone" DROP COLUMN "is_meme_ad";
  END IF;
END $$;

-- 5. Remove is_good if present
ALTER TABLE "public"."ad_clone" DROP COLUMN IF EXISTS "is_good";
