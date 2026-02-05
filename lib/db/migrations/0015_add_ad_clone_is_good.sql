-- Add is_good to ad_clone

--> statement-breakpoint
ALTER TABLE "public"."ad_clone" ADD COLUMN IF NOT EXISTS "is_good" boolean DEFAULT false NOT NULL;
