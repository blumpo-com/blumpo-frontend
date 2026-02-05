-- Pending reasons from cancel feedback form (copied to cancellation_reasons when Stripe confirms cancel)
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "pending_cancellation_reasons" jsonb;
