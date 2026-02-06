-- Consolidated migration (replaces 0010–0017): ad_clone, quick_ads flags, token_account feedback/retention columns. Idempotent.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."ad_clone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"storage_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ad_clone_workflow_id_ad_workflow_id_fk'
  ) THEN
    ALTER TABLE "public"."ad_clone" ADD CONSTRAINT "ad_clone_workflow_id_ad_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."ad_workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

--> statement-breakpoint
DELETE FROM "public"."ad_clone" a
USING "public"."ad_clone" b
WHERE a.workflow_id = b.workflow_id AND a.id > b.id;

--> statement-breakpoint
DROP INDEX IF EXISTS "public"."idx_ad_clone_workflow";

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ad_clone_workflow_id_unique" ON "public"."ad_clone" ("workflow_id");

--> statement-breakpoint
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "cancellation_reasons" jsonb;

--> statement-breakpoint
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "pending_cancellation_reasons" jsonb;

--> statement-breakpoint
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "retention_offer_applied_at" timestamp with time zone;

--> statement-breakpoint
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "retention_discount_renewal_at" timestamp with time zone;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ad_image' AND column_name = 'ready_to_display'
  ) THEN
    ALTER TABLE "public"."ad_image" ADD COLUMN "ready_to_display" boolean NOT NULL DEFAULT true;
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'generation_job' AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE "public"."generation_job" ADD COLUMN "auto_generated" boolean NOT NULL DEFAULT false;
  END IF;
END $$;
