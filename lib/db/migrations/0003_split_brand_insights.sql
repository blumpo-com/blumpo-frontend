-- Migration: Split brand table into brand (core) and brand_insights (dynamic insights)
-- This migration:
-- 1. Creates the brand_insights table
-- 2. Adds website_data_url column to brand
-- 3. Migrates existing insight data from brand to brand_insights
-- 4. Drops insight columns from brand

--> statement-breakpoint
-- Step 1: Create brand_insights table
CREATE TABLE "public"."brand_insights" (
	"brand_id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	-- preferences
	"client_ad_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	-- brand & customer insights
	"industry" text,
	"customer_pain_points" text[] DEFAULT '{}'::text[] NOT NULL,
	"product_description" text,
	"key_features" text[] DEFAULT '{}'::text[] NOT NULL,
	"brand_voice" text,
	"unique_value_prop" text,
	"expected_customer" text,
	"target_customer" text,
	"key_benefits" text[] DEFAULT '{}'::text[] NOT NULL,
	"competitors" text[] DEFAULT '{}'::text[] NOT NULL,
	-- LLM-based insights
	"ins_trigger_events" text[] DEFAULT '{}'::text[] NOT NULL,
	"ins_aspirations" text[] DEFAULT '{}'::text[] NOT NULL,
	"ins_interesting_quotes" text[] DEFAULT '{}'::text[] NOT NULL,
	"ins_marketing_insight" text,
	"ins_trend_opportunity" text,
	"ins_raw" jsonb DEFAULT '[]'::jsonb NOT NULL,
	-- marketing brief summarised from web
	"marketing_brief" text,
	-- Reddit research insights
	"reddit_customer_desires" jsonb DEFAULT '[]'::jsonb,
	"reddit_customer_pain_points" jsonb DEFAULT '[]'::jsonb,
	"reddit_interesting_quotes" jsonb DEFAULT '[]'::jsonb,
	"reddit_purchase_triggers" jsonb DEFAULT '[]'::jsonb,
	"reddit_marketing_brief" text
);
--> statement-breakpoint
-- Step 2: Add foreign key constraint
ALTER TABLE "public"."brand_insights"
  ADD CONSTRAINT "brand_insights_brand_id_brand_id_fk"
  FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Step 3: Add website_data_url column to brand
ALTER TABLE "public"."brand" ADD COLUMN "website_data_url" text;
--> statement-breakpoint
-- Step 4: Migrate existing data from brand to brand_insights
-- For each existing brand row, create a corresponding brand_insights row
INSERT INTO "public"."brand_insights" (
	"brand_id",
	"created_at",
	"updated_at",
	"client_ad_preferences",
	"industry",
	"customer_pain_points",
	"product_description",
	"key_features",
	"brand_voice",
	"unique_value_prop",
	"expected_customer",
	"target_customer",
	"key_benefits",
	"competitors",
	"ins_trigger_events",
	"ins_aspirations",
	"ins_interesting_quotes",
	"ins_marketing_insight",
	"ins_trend_opportunity",
	"ins_raw"
)
SELECT
	"id" as "brand_id",
	"created_at",
	"updated_at",
	COALESCE("client_ad_preferences", '{}'::jsonb) as "client_ad_preferences",
	"industry",
	COALESCE("customer_pain_points", '{}'::text[]) as "customer_pain_points",
	"product_description",
	COALESCE("key_features", '{}'::text[]) as "key_features",
	"brand_voice",
	"unique_value_prop",
	"expected_customer",
	"target_customer",
	COALESCE("key_benefits", '{}'::text[]) as "key_benefits",
	COALESCE("competitors", '{}'::text[]) as "competitors",
	COALESCE("ins_trigger_events", '{}'::text[]) as "ins_trigger_events",
	COALESCE("ins_aspirations", '{}'::text[]) as "ins_aspirations",
	COALESCE("ins_interesting_quotes", '{}'::text[]) as "ins_interesting_quotes",
	"ins_marketing_insight",
	"ins_trend_opportunity",
	COALESCE("ins_raw", '[]'::jsonb) as "ins_raw"
FROM "public"."brand";
--> statement-breakpoint
-- Step 5: Drop insight columns from brand table
ALTER TABLE "public"."brand" DROP COLUMN "client_ad_preferences";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "industry";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "customer_pain_points";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "product_description";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "key_features";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "brand_voice";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "unique_value_prop";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "expected_customer";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "target_customer";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "key_benefits";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "competitors";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "ins_trigger_events";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "ins_aspirations";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "ins_interesting_quotes";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "ins_marketing_insight";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "ins_trend_opportunity";
--> statement-breakpoint
ALTER TABLE "public"."brand" DROP COLUMN "ins_raw";

