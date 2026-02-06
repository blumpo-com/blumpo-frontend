-- Next renewal that has the 70% discount; hide "(70% off)" after that cycle
ALTER TABLE "public"."token_account" ADD COLUMN IF NOT EXISTS "retention_discount_renewal_at" timestamp with time zone;
