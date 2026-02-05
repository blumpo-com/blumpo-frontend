-- Remove is_good from ad_clone

--> statement-breakpoint
ALTER TABLE "public"."ad_clone" DROP COLUMN IF EXISTS "is_good";
