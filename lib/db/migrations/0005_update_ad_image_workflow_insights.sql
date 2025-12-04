-- Migration: Update ad_image, ad_workflow, and brand_insights tables
-- This migration:
-- 1. Adds DEFAULT gen_random_uuid() to ad_image.id
-- 2. Adds unique constraint on ad_workflow.workflow_uid
-- 3. Updates brand_insights: removes expected_customer, ins_interesting_quotes, target_customer; adds target_customers and solution

--> statement-breakpoint
-- Add default to ad_image.id
ALTER TABLE "public"."ad_image" 
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

--> statement-breakpoint
-- Add unique constraint on ad_workflow.workflow_uid (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'ad_workflow_workflow_uid_key'
  ) THEN
    ALTER TABLE "public"."ad_workflow" 
      ADD CONSTRAINT "ad_workflow_workflow_uid_key" UNIQUE ("workflow_uid");
  END IF;
END $$;

--> statement-breakpoint
-- Drop expected_customer column from brand_insights
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brand_insights' 
    AND column_name = 'expected_customer'
  ) THEN
    ALTER TABLE "public"."brand_insights" DROP COLUMN "expected_customer";
  END IF;
END $$;

--> statement-breakpoint
-- Drop ins_interesting_quotes column from brand_insights
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brand_insights' 
    AND column_name = 'ins_interesting_quotes'
  ) THEN
    ALTER TABLE "public"."brand_insights" DROP COLUMN "ins_interesting_quotes";
  END IF;
END $$;

--> statement-breakpoint
-- Drop target_customer column from brand_insights (will be replaced by target_customers)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brand_insights' 
    AND column_name = 'target_customer'
  ) THEN
    ALTER TABLE "public"."brand_insights" DROP COLUMN "target_customer";
  END IF;
END $$;

--> statement-breakpoint
-- Add target_customers column to brand_insights
ALTER TABLE "public"."brand_insights" 
  ADD COLUMN IF NOT EXISTS "target_customers" text[] DEFAULT '{}'::text[] NOT NULL;

--> statement-breakpoint
-- Add solution column to brand_insights
ALTER TABLE "public"."brand_insights" 
  ADD COLUMN IF NOT EXISTS "solution" text;

