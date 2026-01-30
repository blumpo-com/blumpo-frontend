-- Add cancellation_reasons to token_account (cancel feedback survey)
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "cancellation_reasons" jsonb;
