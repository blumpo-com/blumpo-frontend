-- Migration: Introduce ads data model (archetypes, workflows, ad images, analytics)
-- This migration:
-- 1. Creates ad_archetype table and seeds initial values
-- 2. Creates ad_workflow table
-- 3. Creates ad_image table (replacing asset_image)
-- 4. Migrates data from asset_image to ad_image
-- 5. Updates generation_job (nullable prompt, archetype_code, archetype_mode, FK to ad_image)
-- 6. Creates ad_event table for analytics

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."ad_archetype" (
	"code" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
-- Seed ad_archetype with initial values (idempotent)
INSERT INTO "public"."ad_archetype" ("code", "display_name", "description") VALUES
	('problem_solution', 'Problem-Solution', 'Show user''s pain point and how your product resolves it'),
	('testimonial', 'Testimonial', 'Build the ad around a customer review or quote'),
	('competitor_comparison', 'Competitor Comparison', 'Visually present how the product works vs competitors'),
	('promotion_offer', 'Promotion (Offer)', 'Communicate a clear, time-limited deal to prompt immediate action'),
	('value_proposition', 'Value Proposition', 'Highlight the core benefit and what sets the product apart'),
	('random', 'Random', 'Use 2 random archetypes to generate ads')
ON CONFLICT ("code") DO UPDATE SET
	"display_name" = EXCLUDED."display_name",
	"description" = EXCLUDED."description",
	"updated_at" = now();

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."ad_workflow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"archetype_code" text NOT NULL,
	"workflow_uid" text NOT NULL,
	"variant_key" text NOT NULL,
	"format" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_workflow_unique_variant" UNIQUE("archetype_code", "variant_key")
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_workflow_archetype" ON "public"."ad_workflow" ("archetype_code");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_workflow_uid" ON "public"."ad_workflow" ("workflow_uid");

--> statement-breakpoint
-- Add FK constraint for ad_workflow (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_workflow_archetype_code_ad_archetype_code_fk'
	) THEN
		ALTER TABLE "public"."ad_workflow" ADD CONSTRAINT "ad_workflow_archetype_code_ad_archetype_code_fk" FOREIGN KEY ("archetype_code") REFERENCES "public"."ad_archetype"("code") ON DELETE restrict ON UPDATE no action;
	END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."ad_image" (
	"id" uuid PRIMARY KEY NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"brand_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text,
	"storage_key" text NOT NULL,
	"public_url" text,
	"bytes_size" bigint NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"format" text NOT NULL,
	"archetypes" text[] DEFAULT '{}'::text[] NOT NULL,
	"ban_flag" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"delete_at" timestamp with time zone
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_image_user_time" ON "public"."ad_image" ("user_id", "created_at" DESC NULLS LAST);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_image_job" ON "public"."ad_image" ("job_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_image_brand" ON "public"."ad_image" ("brand_id");

--> statement-breakpoint
-- Add FK constraints for ad_image (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_image_job_id_fk'
	) THEN
		ALTER TABLE "public"."ad_image" ADD CONSTRAINT "ad_image_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."generation_job"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_image_user_id_fk'
	) THEN
		ALTER TABLE "public"."ad_image" ADD CONSTRAINT "ad_image_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_image_brand_id_fk'
	) THEN
		ALTER TABLE "public"."ad_image" ADD CONSTRAINT "ad_image_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;

--> statement-breakpoint
-- Migrate data from asset_image to ad_image
-- Only migrate if asset_image table exists and ad_image is empty
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_name = 'asset_image'
	) AND NOT EXISTS (
		SELECT 1 FROM "public"."ad_image" LIMIT 1
	) THEN
		INSERT INTO "public"."ad_image" (
			"id", "job_id", "user_id", "created_at", "title", 
			"storage_key", "public_url", "bytes_size", "width", 
			"height", "format", "is_deleted"
		)
		SELECT 
			"id", "job_id", "user_id", "created_at", "title",
			"storage_key", "public_url", "bytes_size", "width",
			"height", "format", "is_deleted"
		FROM "public"."asset_image";
	END IF;
END $$;

--> statement-breakpoint
-- Update generation_job: make prompt nullable
ALTER TABLE "public"."generation_job" ALTER COLUMN "prompt" DROP NOT NULL;

--> statement-breakpoint
-- Update generation_job: add archetype_code (FK to ad_archetype)
ALTER TABLE "public"."generation_job" ADD COLUMN IF NOT EXISTS "archetype_code" text;

--> statement-breakpoint
-- Migrate data from old 'archetype' column to 'archetype_code' if it exists
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema = 'public' 
		AND table_name = 'generation_job' 
		AND column_name = 'archetype'
	) THEN
		-- Copy archetype values to archetype_code where archetype_code is null
		UPDATE "public"."generation_job" 
		SET "archetype_code" = "archetype" 
		WHERE "archetype_code" IS NULL AND "archetype" IS NOT NULL;
	END IF;
END $$;

--> statement-breakpoint
-- Add FK constraint for generation_job.archetype_code (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'generation_job_archetype_code_ad_archetype_code_fk'
	) THEN
		ALTER TABLE "public"."generation_job" ADD CONSTRAINT "generation_job_archetype_code_ad_archetype_code_fk" FOREIGN KEY ("archetype_code") REFERENCES "public"."ad_archetype"("code") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;

--> statement-breakpoint
-- Update generation_job: add archetype_mode (default 'single')
ALTER TABLE "public"."generation_job" ADD COLUMN IF NOT EXISTS "archetype_mode" text DEFAULT 'single' NOT NULL;

--> statement-breakpoint
-- Update generation_job: add product photo fields
ALTER TABLE "public"."generation_job" ADD COLUMN IF NOT EXISTS "product_photo_urls" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "public"."generation_job" ADD COLUMN IF NOT EXISTS "product_photo_mode" text DEFAULT 'brand' NOT NULL;

--> statement-breakpoint
-- Update generation_job: add formats array (multiple formats support)
ALTER TABLE "public"."generation_job" ADD COLUMN IF NOT EXISTS "formats" text[] DEFAULT '{}'::text[] NOT NULL;

--> statement-breakpoint
-- Update generation_job: make legacy format column nullable
ALTER TABLE "public"."generation_job" ALTER COLUMN "format" DROP NOT NULL;

--> statement-breakpoint
-- Update generation_job: add selected insight fields
ALTER TABLE "public"."generation_job" ADD COLUMN IF NOT EXISTS "selected_pain_points" text[] DEFAULT '{}'::text[] NOT NULL;
ALTER TABLE "public"."generation_job" ADD COLUMN IF NOT EXISTS "insight_source" text DEFAULT 'auto' NOT NULL;

--> statement-breakpoint
-- Remove custom_photo_id column from generation_job
-- First, drop the FK constraint if it exists
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'generation_job_custom_photo_id_asset_image_id_fk'
	) THEN
		ALTER TABLE "public"."generation_job" DROP CONSTRAINT "generation_job_custom_photo_id_asset_image_id_fk";
	END IF;
	
	IF EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'generation_job_custom_photo_id_ad_image_id_fk'
	) THEN
		ALTER TABLE "public"."generation_job" DROP CONSTRAINT "generation_job_custom_photo_id_ad_image_id_fk";
	END IF;
END $$;

--> statement-breakpoint
-- Drop custom_photo_id column if it exists
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema = 'public' 
		AND table_name = 'generation_job' 
		AND column_name = 'custom_photo_id'
	) THEN
		ALTER TABLE "public"."generation_job" DROP COLUMN "custom_photo_id";
	END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."ad_event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid,
	"brand_id" uuid,
	"job_id" uuid,
	"ad_image_id" uuid,
	"archetype_code" text,
	"workflow_id" uuid,
	"event_type" text NOT NULL,
	"event_source" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_event_ad_image" ON "public"."ad_event" ("ad_image_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_event_job" ON "public"."ad_event" ("job_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_event_brand" ON "public"."ad_event" ("brand_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_event_user" ON "public"."ad_event" ("user_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_event_type_time" ON "public"."ad_event" ("event_type", "created_at" DESC);

--> statement-breakpoint
-- Add FK constraints for ad_event (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_event_user_id_user_id_fk'
	) THEN
		ALTER TABLE "public"."ad_event" ADD CONSTRAINT "ad_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_event_brand_id_brand_id_fk'
	) THEN
		ALTER TABLE "public"."ad_event" ADD CONSTRAINT "ad_event_brand_id_brand_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brand"("id") ON DELETE set null ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_event_job_id_generation_job_id_fk'
	) THEN
		ALTER TABLE "public"."ad_event" ADD CONSTRAINT "ad_event_job_id_generation_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."generation_job"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_event_ad_image_id_ad_image_id_fk'
	) THEN
		ALTER TABLE "public"."ad_event" ADD CONSTRAINT "ad_event_ad_image_id_ad_image_id_fk" FOREIGN KEY ("ad_image_id") REFERENCES "public"."ad_image"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_event_archetype_code_ad_archetype_code_fk'
	) THEN
		ALTER TABLE "public"."ad_event" ADD CONSTRAINT "ad_event_archetype_code_ad_archetype_code_fk" FOREIGN KEY ("archetype_code") REFERENCES "public"."ad_archetype"("code") ON DELETE set null ON UPDATE no action;
	END IF;
	
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints 
		WHERE constraint_schema = 'public' 
		AND constraint_name = 'ad_event_workflow_id_ad_workflow_id_fk'
	) THEN
		ALTER TABLE "public"."ad_event" ADD CONSTRAINT "ad_event_workflow_id_ad_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."ad_workflow"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;

