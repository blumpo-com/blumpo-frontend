-- When user accepted "70% off next month + 200 credits" retention offer
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "retention_offer_applied_at" timestamp with time zone;
