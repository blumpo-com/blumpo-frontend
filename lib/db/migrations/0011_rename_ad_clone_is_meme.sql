-- Rename ad_clone.is_meme_ad -> is_meme

--> statement-breakpoint
ALTER TABLE "public"."ad_clone" RENAME COLUMN "is_meme_ad" TO "is_meme";
