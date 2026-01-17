-- Migration: Add quick ads flags to ad_image and generation_job
-- This migration:
-- 1. Adds ready_to_display boolean column to ad_image table (default: false)
-- 2. Adds auto_generated boolean column to generation_job table (default: false)

--> statement-breakpoint
-- Add ready_to_display column to ad_image (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_image' 
    AND column_name = 'ready_to_display'
  ) THEN
    ALTER TABLE "public"."ad_image"
      ADD COLUMN "ready_to_display" boolean NOT NULL DEFAULT false;
  END IF;
END $$;

--> statement-breakpoint
-- Add auto_generated column to generation_job (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generation_job' 
    AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE "public"."generation_job"
      ADD COLUMN "auto_generated" boolean NOT NULL DEFAULT false;
  END IF;
END $$;

