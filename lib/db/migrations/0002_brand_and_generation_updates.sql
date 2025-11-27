-- Migration: Add brand table, update generation_job, and create brand_extraction_status
-- This migration adds:
-- 1. The brand table (merged brand + brand_insights)
-- 2. Updates generation_job with brand_id, archetype, format, custom_photo_id, and archetype_inputs
-- 3. Creates brand_extraction_status table for n8n workflow progress tracking

--> statement-breakpoint
CREATE TABLE "public"."brand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	-- core brand data
	"name" text NOT NULL,
	"website_url" text NOT NULL,
	-- brand assets
	"language" text DEFAULT 'en' NOT NULL,
	"fonts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"colors" text[] DEFAULT '{}'::text[] NOT NULL,
	"photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"hero_photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"logo_url" text,
	-- preferences
	"client_ad_preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	-- brand & customer insights
	"industry" text,
	"customer_pain_points" text[] DEFAULT '{}'::text[],
	"product_description" text,
	"key_features" text[] DEFAULT '{}'::text[],
	"brand_voice" text,
	"unique_value_prop" text,
	"expected_customer" text,
	"target_customer" text,
	"key_benefits" text[] DEFAULT '{}'::text[],
	"competitors" text[] DEFAULT '{}'::text[],
	-- insights
	"ins_trigger_events" text[] DEFAULT '{}'::text[],
	"ins_aspirations" text[] DEFAULT '{}'::text[],
	"ins_interesting_quotes" text[] DEFAULT '{}'::text[],
	"ins_marketing_insight" text,
	"ins_trend_opportunity" text,
	"ins_raw" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE INDEX "idx_brand_user" ON "public"."brand" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "brand_user_website_unique" ON "public"."brand" USING btree ("user_id", "website_url");
--> statement-breakpoint
ALTER TABLE "public"."brand" ADD CONSTRAINT "brand_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "public"."generation_job" ADD COLUMN "brand_id" uuid;
--> statement-breakpoint
ALTER TABLE "public"."generation_job" ADD COLUMN "archetype" text;
--> statement-breakpoint
ALTER TABLE "public"."generation_job" ADD COLUMN "format" text;
--> statement-breakpoint
ALTER TABLE "public"."generation_job" ADD COLUMN "custom_photo_id" uuid;
--> statement-breakpoint
ALTER TABLE "public"."generation_job" ADD COLUMN "archetype_inputs" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "public"."generation_job" ADD CONSTRAINT "generation_job_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "public"."generation_job" ADD CONSTRAINT "generation_job_custom_photo_id_asset_image_id_fk" FOREIGN KEY ("custom_photo_id") REFERENCES "public"."asset_image"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "public"."brand_extraction_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"colors_status" text DEFAULT 'pending',
	"colors_error" text,
	"fonts_status" text DEFAULT 'pending',
	"fonts_error" text,
	"logo_status" text DEFAULT 'pending',
	"logo_error" text,
	"hero_status" text DEFAULT 'pending',
	"hero_error" text,
	"insights_status" text DEFAULT 'pending',
	"insights_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_extraction_status_brand_id_unique" UNIQUE ("brand_id")
);
--> statement-breakpoint
ALTER TABLE "public"."brand_extraction_status"
  ADD CONSTRAINT "brand_extraction_status_brand_id_brand_id_fk"
  FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE cascade ON UPDATE no action;
