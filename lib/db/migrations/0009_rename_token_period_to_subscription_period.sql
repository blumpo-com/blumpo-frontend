-- Migration: Rename token_period enum to subscription_period with MONTHLY/YEARLY values
-- This migration:
-- 1. Creates new subscription_period enum with values ['MONTHLY', 'YEARLY']
-- 2. Converts existing data: 'MONTH' -> 'MONTHLY', 'DAY'/'WEEK' -> 'MONTHLY'
-- 3. Updates token_account.period column to use new enum
-- 4. Updates default value from 'MONTH' to 'MONTHLY'
-- 5. Drops old token_period enum

--> statement-breakpoint
-- Create new subscription_period enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_period') THEN
    CREATE TYPE "public"."subscription_period" AS ENUM('MONTHLY', 'YEARLY');
  END IF;
END $$;

--> statement-breakpoint
-- Convert existing data and update column type by dropping and recreating
DO $$
BEGIN
  -- Only proceed if the column uses the old token_period enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'token_account' 
    AND column_name = 'period'
    AND udt_name = 'token_period'
  ) THEN
    -- Create a temporary column to store the converted value (drop it first if it exists from a failed migration)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'token_account' 
      AND column_name = 'period_new'
    ) THEN
      ALTER TABLE "public"."token_account" DROP COLUMN "period_new";
    END IF;
    
    ALTER TABLE "public"."token_account" 
      ADD COLUMN "period_new" "public"."subscription_period" DEFAULT 'MONTHLY'::"public"."subscription_period";
    
    -- Copy and convert data from old column to new column
    UPDATE "public"."token_account"
    SET "period_new" = CASE 
      WHEN "period"::text = 'MONTH' THEN 'MONTHLY'::"public"."subscription_period"
      WHEN "period"::text IN ('DAY', 'WEEK') THEN 'MONTHLY'::"public"."subscription_period"  -- Convert DAY/WEEK to MONTHLY as safe default
      ELSE 'MONTHLY'::"public"."subscription_period"  -- Default fallback
    END;
    
    -- Drop the old column
    ALTER TABLE "public"."token_account" 
      DROP COLUMN "period";
    
    -- Rename the new column to the original name
    ALTER TABLE "public"."token_account" 
      RENAME COLUMN "period_new" TO "period";
    
    -- Set NOT NULL constraint and default value
    ALTER TABLE "public"."token_account" 
      ALTER COLUMN "period" SET NOT NULL;
    
    ALTER TABLE "public"."token_account" 
      ALTER COLUMN "period" SET DEFAULT 'MONTHLY'::"public"."subscription_period";
  END IF;
END $$;

--> statement-breakpoint
-- Drop old token_period enum (only if no other columns use it)
DO $$
BEGIN
  -- Check if any columns still use the old enum type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE udt_name = 'token_period'
  ) THEN
    DROP TYPE IF EXISTS "public"."token_period" CASCADE;
  END IF;
END $$;

