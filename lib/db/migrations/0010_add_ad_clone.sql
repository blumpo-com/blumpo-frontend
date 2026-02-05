-- Migration: Add ad_clone table (workflow clone with storage key/url and meme flag)

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."ad_clone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"storage_url" text,
	"is_meme_ad" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "public"."ad_clone" ADD CONSTRAINT "ad_clone_workflow_id_ad_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."ad_workflow"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_clone_workflow" ON "public"."ad_clone" ("workflow_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ad_clone_meme" ON "public"."ad_clone" ("is_meme_ad");
