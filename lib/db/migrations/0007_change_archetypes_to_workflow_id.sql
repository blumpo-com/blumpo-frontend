-- Migration: Change ad_image.archetypes to ad_image.workflow_id
-- This migration:
-- 1. Drops the archetypes column from ad_image
-- 2. Adds workflow_id column with FK to ad_workflow
-- 3. Adds index on workflow_id

--> statement-breakpoint
-- Drop archetypes column from ad_image (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_image' 
    AND column_name = 'archetypes'
  ) THEN
    ALTER TABLE "public"."ad_image" DROP COLUMN "archetypes";
  END IF;
END $$;

--> statement-breakpoint
-- Add workflow_id column to ad_image (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_image' 
    AND column_name = 'workflow_id'
  ) THEN
    ALTER TABLE "public"."ad_image" 
      ADD COLUMN "workflow_id" uuid;
  END IF;
END $$;

--> statement-breakpoint
-- Add FK constraint for workflow_id (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'ad_image_workflow_id_ad_workflow_id_fk'
  ) THEN
    ALTER TABLE "public"."ad_image" 
      ADD CONSTRAINT "ad_image_workflow_id_ad_workflow_id_fk" 
      FOREIGN KEY ("workflow_id") 
      REFERENCES "public"."ad_workflow"("id") 
      ON DELETE set null 
      ON UPDATE no action;
  END IF;
END $$;

--> statement-breakpoint
-- Add index on workflow_id (idempotent)
CREATE INDEX IF NOT EXISTS "idx_ad_image_workflow" ON "public"."ad_image" ("workflow_id");

