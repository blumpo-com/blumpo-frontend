-- Uruchom w Neon SQL Editor. workflow_id ma być unikalny w ad_clone (jeden klon na workflow).

-- 1. Usuń duplikaty: zostaw po jednym wierszu na workflow_id (ten z mniejszym id)
DELETE FROM "public"."ad_clone" a
USING "public"."ad_clone" b
WHERE a.workflow_id = b.workflow_id AND a.id > b.id;

-- 2. Usuń stary indeks (jeśli istnieje)
DROP INDEX IF EXISTS "public"."idx_ad_clone_workflow";

-- 3. Dodaj unikalny indeks na workflow_id
CREATE UNIQUE INDEX IF NOT EXISTS "ad_clone_workflow_id_unique" ON "public"."ad_clone" ("workflow_id");
