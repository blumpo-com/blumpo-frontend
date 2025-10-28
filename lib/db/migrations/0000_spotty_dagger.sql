DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
		CREATE TYPE "public"."job_status" AS ENUM('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_period') THEN
		CREATE TYPE "public"."token_period" AS ENUM('DAY', 'WEEK', 'MONTH');
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'variant_kind') THEN
		CREATE TYPE "public"."variant_kind" AS ENUM('ORIGINAL', 'THUMB', 'WEB', 'PRINT');
	END IF;
END $$;--> statement-breakpoint
CREATE TABLE "asset_image" (
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
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_otp" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"code_hash" text NOT NULL,
	"purpose" text DEFAULT 'LOGIN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"resend_count" integer DEFAULT 0 NOT NULL,
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "generation_job" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"prompt" text NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tokens_cost" bigint DEFAULT 0 NOT NULL,
	"ledger_id" bigint,
	"error_code" text,
	"error_message" text,
	CONSTRAINT "generation_job_ledger_id_unique" UNIQUE("ledger_id")
);
--> statement-breakpoint
CREATE TABLE "token_account" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"plan_code" text DEFAULT 'FREE' NOT NULL,
	"tokens_per_period" bigint DEFAULT 50 NOT NULL,
	"period" "token_period" DEFAULT 'MONTH' NOT NULL,
	"last_refill_at" timestamp with time zone,
	"next_refill_at" timestamp with time zone,
	"rollover_cap" bigint,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"subscription_status" text
);
--> statement-breakpoint
CREATE TABLE "token_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delta" bigint NOT NULL,
	"reason" text NOT NULL,
	"reference_id" text,
	"balance_after" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"photo_url" text,
	"phone_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	"ban_flag" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "asset_image" ADD CONSTRAINT "asset_image_job_id_generation_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."generation_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_image" ADD CONSTRAINT "asset_image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_otp" ADD CONSTRAINT "auth_otp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_job" ADD CONSTRAINT "generation_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_job" ADD CONSTRAINT "generation_job_ledger_id_token_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "public"."token_ledger"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_account" ADD CONSTRAINT "token_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_ledger" ADD CONSTRAINT "token_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_asset_image_user_time" ON "asset_image" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_asset_image_job" ON "asset_image" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_auth_otp_email_active" ON "auth_otp" USING btree ("email") WHERE consumed_at IS NULL;--> statement-breakpoint
CREATE INDEX "idx_generation_job_user_time" ON "generation_job" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_generation_job_status" ON "generation_job" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_token_account_stripe_customer" ON "token_account" USING btree ("stripe_customer_id") WHERE stripe_customer_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_token_account_stripe_subscription" ON "token_account" USING btree ("stripe_subscription_id") WHERE stripe_subscription_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_token_ledger_user_time" ON "token_ledger" USING btree ("user_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_token_ledger_reason_ref" ON "token_ledger" USING btree ("reason","reference_id") WHERE reference_id IS NOT NULL;