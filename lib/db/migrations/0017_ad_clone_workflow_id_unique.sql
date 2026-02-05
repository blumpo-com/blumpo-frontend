-- Make workflow_id unique in ad_clone (one clone per workflow)

-- Remove duplicate rows: keep one row per workflow_id (smallest id)
DELETE FROM "public"."ad_clone" a
USING "public"."ad_clone" b
WHERE a.workflow_id = b.workflow_id AND a.id > b.id;

--> statement-breakpoint
DROP INDEX IF EXISTS "public"."idx_ad_clone_workflow";

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ad_clone_workflow_id_unique" ON "public"."ad_clone" ("workflow_id");
