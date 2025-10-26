-- Fresh migration for the token-based schema
-- This migration creates all tables from scratch

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

-- Create enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_period') THEN
    CREATE TYPE token_period AS ENUM ('DAY','WEEK','MONTH');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'variant_kind') THEN
    CREATE TYPE variant_kind AS ENUM ('ORIGINAL','THUMB','WEB','PRINT');
  END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" citext UNIQUE NOT NULL,
  "display_name" text NOT NULL,
  "photo_url" text,
  "phone_number" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_login_at" timestamp with time zone,
  "ban_flag" boolean DEFAULT false NOT NULL
);

-- Token account table (1:1 with user)
CREATE TABLE IF NOT EXISTS "token_account" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "balance" bigint DEFAULT 0 NOT NULL,
  "plan_code" text DEFAULT 'FREE' NOT NULL,
  "tokens_per_period" bigint DEFAULT 50 NOT NULL,
  "period" token_period DEFAULT 'MONTH' NOT NULL,
  "last_refill_at" timestamp with time zone,
  "next_refill_at" timestamp with time zone,
  "rollover_cap" bigint,
  CONSTRAINT "token_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "balance_check" CHECK ("balance" >= 0)
);

-- Token ledger table (auditing/accounting)
CREATE TABLE IF NOT EXISTS "token_ledger" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "delta" bigint NOT NULL,
  "reason" text NOT NULL,
  "reference_id" text,
  "balance_after" bigint NOT NULL,
  CONSTRAINT "token_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "delta_check" CHECK ("delta" <> 0)
);

-- Generation jobs table
CREATE TABLE IF NOT EXISTS "generation_job" (
  "id" uuid PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "status" job_status DEFAULT 'QUEUED' NOT NULL,
  "prompt" text NOT NULL,
  "params" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "tokens_cost" bigint DEFAULT 0 NOT NULL,
  "ledger_id" bigint,
  "error_code" text,
  "error_message" text,
  CONSTRAINT "generation_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade,
  CONSTRAINT "generation_job_ledger_id_token_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "token_ledger"("id") ON DELETE set null,
  CONSTRAINT "generation_job_ledger_id_unique" UNIQUE("ledger_id")
);

-- Asset image table
CREATE TABLE IF NOT EXISTS "asset_image" (
  "id" uuid PRIMARY KEY NOT NULL,
  "job_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "title" text,
  "description" text,
  "storage_key" text NOT NULL,
  "public_url" text,
  "mime_type" text NOT NULL,
  "bytes_size" bigint NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "format" text NOT NULL,
  "sha256" text,
  "safety_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  CONSTRAINT "asset_image_job_id_generation_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "generation_job"("id") ON DELETE cascade,
  CONSTRAINT "asset_image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade
);

-- Asset image variant table
CREATE TABLE IF NOT EXISTS "asset_image_variant" (
  "id" uuid PRIMARY KEY NOT NULL,
  "image_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "kind" variant_kind NOT NULL,
  "storage_key" text NOT NULL,
  "public_url" text,
  "mime_type" text NOT NULL,
  "bytes_size" bigint NOT NULL,
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "format" text NOT NULL,
  "sha256" text,
  CONSTRAINT "asset_image_variant_image_id_asset_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "asset_image"("id") ON DELETE cascade
);

-- Auth OTP table
CREATE TABLE IF NOT EXISTS "auth_otp" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" citext NOT NULL,
  "user_id" uuid,
  "code_hash" text NOT NULL,
  "purpose" text DEFAULT 'LOGIN' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 5 NOT NULL,
  "resend_count" integer DEFAULT 0 NOT NULL,
  "ip_address" inet,
  "user_agent" text,
  CONSTRAINT "auth_otp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE set null
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_token_ledger_user_time" ON "token_ledger" ("user_id","occurred_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_token_ledger_reason_ref" ON "token_ledger" ("reason","reference_id") WHERE "reference_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_generation_job_user_time" ON "generation_job" ("user_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_generation_job_status" ON "generation_job" ("status");
CREATE INDEX IF NOT EXISTS "idx_asset_image_user_time" ON "asset_image" ("user_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_asset_image_job" ON "asset_image" ("job_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_asset_variant_per_kind" ON "asset_image_variant" ("image_id","kind");
CREATE INDEX IF NOT EXISTS "idx_auth_otp_email_active" ON "auth_otp" ("email") WHERE "consumed_at" IS NULL;