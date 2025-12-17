-- Migration: Update insights and add promotion value
-- This migration:
-- 1. Renames selected_pain_points to selected_insights in generation_job
-- 2. Adds promotion_value_insight JSONB column to generation_job
-- 3. Adds website_text TEXT column to brand_insights

--> statement-breakpoint
-- Rename selected_pain_points to selected_insights in generation_job, or add selected_insights if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generation_job' 
    AND column_name = 'selected_pain_points'
  ) THEN
    ALTER TABLE "public"."generation_job" 
      RENAME COLUMN "selected_pain_points" TO "selected_insights";
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generation_job' 
    AND column_name = 'selected_insights'
  ) THEN
    ALTER TABLE "public"."generation_job" 
      ADD COLUMN "selected_insights" text[] DEFAULT '{}'::text[] NOT NULL;
  END IF;
END $$;

--> statement-breakpoint
-- Add promotion_value_insight JSONB column to generation_job
ALTER TABLE "public"."generation_job" 
  ADD COLUMN IF NOT EXISTS "promotion_value_insight" jsonb DEFAULT '{}'::jsonb NOT NULL;

--> statement-breakpoint
-- Add website_text TEXT column to brand_insights
ALTER TABLE "public"."brand_insights" 
  ADD COLUMN IF NOT EXISTS "website_text" text;
