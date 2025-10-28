-- Auto-generated migration with data seeding and view creation
-- Drop asset_image_variant table if it exists (cleanup)
DROP TABLE IF EXISTS "asset_image_variant" CASCADE;--> statement-breakpoint

-- Drop variant_kind enum if it exists (cleanup)
DROP TYPE IF EXISTS "public"."variant_kind";--> statement-breakpoint

CREATE TABLE "generation_pricing" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"strategy" text DEFAULT 'STATIC' NOT NULL,
	"base_cost_tokens" bigint NOT NULL,
	"rules" jsonb DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plan" (
	"plan_code" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"monthly_tokens" bigint NOT NULL,
	"price_amount_minor" bigint NOT NULL,
	"price_currency" text DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"rollover_cap" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topup_plan" (
	"topup_sku" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"tokens_amount" bigint NOT NULL,
	"price_amount_minor" bigint NOT NULL,
	"price_currency" text DEFAULT 'USD' NOT NULL,
	"stripe_price_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topup_plan_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_generation_pricing_single_active" ON "generation_pricing" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_subscription_plan_single_default" ON "subscription_plan" USING btree ("is_default") WHERE is_default = true;--> statement-breakpoint
CREATE INDEX "idx_subscription_plan_active_sort" ON "subscription_plan" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "idx_topup_plan_active_sort" ON "topup_plan" USING btree ("is_active","sort_order");--> statement-breakpoint

-- Add table comments for documentation
COMMENT ON TABLE "public"."subscription_plan" IS 'Subscription plans with pricing and token allowances';
COMMENT ON COLUMN "public"."subscription_plan"."price_amount_minor" IS 'Price in minor currency units (e.g., cents for USD)';
COMMENT ON COLUMN "public"."subscription_plan"."monthly_tokens" IS 'Number of tokens granted per month';
COMMENT ON COLUMN "public"."subscription_plan"."rollover_cap" IS 'Maximum tokens that can roll over to next period';

COMMENT ON TABLE "public"."topup_plan" IS 'One-time token top-up plans';
COMMENT ON COLUMN "public"."topup_plan"."tokens_amount" IS 'Number of tokens granted by this top-up';
COMMENT ON COLUMN "public"."topup_plan"."price_amount_minor" IS 'Price in minor currency units (e.g., cents for USD)';

COMMENT ON TABLE "public"."generation_pricing" IS 'Versioned generation cost configuration';
COMMENT ON COLUMN "public"."generation_pricing"."strategy" IS 'Pricing strategy (STATIC, RULES, etc.)';
COMMENT ON COLUMN "public"."generation_pricing"."base_cost_tokens" IS 'Base token cost for generation';
COMMENT ON COLUMN "public"."generation_pricing"."rules" IS 'Additional pricing rules as JSON';

-- Insert subscription plans (idempotent) - MUST happen before adding FK constraint
INSERT INTO "public"."subscription_plan" (
  "plan_code", "display_name", "monthly_tokens", "price_amount_minor", 
  "price_currency", "is_active", "is_default", "sort_order"
) VALUES 
  ('FREE', 'Free Plan', 50, 0, 'USD', TRUE, TRUE, 1),
  ('STARTER', 'Starter Plan', 300, 900, 'USD', TRUE, FALSE, 2),
  ('PRO', 'Pro Plan', 1500, 2900, 'USD', TRUE, FALSE, 3)
ON CONFLICT ("plan_code") DO UPDATE SET
  "display_name" = EXCLUDED."display_name",
  "monthly_tokens" = EXCLUDED."monthly_tokens",
  "price_amount_minor" = EXCLUDED."price_amount_minor",
  "price_currency" = EXCLUDED."price_currency",
  "is_active" = EXCLUDED."is_active",
  "is_default" = EXCLUDED."is_default",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = now();

-- Data migration for existing token_account records before adding FK constraint
DO $$
BEGIN
  -- Only proceed if the columns still exist (idempotent)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'token_account' 
    AND column_name = 'tokens_per_period'
  ) THEN
    
    -- Update plan codes based on tokens_per_period
    UPDATE "public"."token_account" 
    SET "plan_code" = CASE 
      WHEN "tokens_per_period" = 50 THEN 'FREE'
      WHEN "tokens_per_period" = 300 THEN 'STARTER'
      WHEN "tokens_per_period" = 1500 THEN 'PRO'
      ELSE COALESCE("plan_code", 'FREE')
    END
    WHERE "plan_code" IS NULL OR "plan_code" NOT IN ('FREE', 'STARTER', 'PRO');
    
    -- Ensure all accounts have a valid plan_code
    UPDATE "public"."token_account" 
    SET "plan_code" = 'FREE' 
    WHERE "plan_code" IS NULL;
    
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "token_account" ADD CONSTRAINT "token_account_plan_code_subscription_plan_plan_code_fk" FOREIGN KEY ("plan_code") REFERENCES "public"."subscription_plan"("plan_code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "token_account" DROP COLUMN "tokens_per_period";--> statement-breakpoint
ALTER TABLE "token_account" DROP COLUMN "rollover_cap";--> statement-breakpoint

-- Insert topup plans (idempotent)
INSERT INTO "public"."topup_plan" (
  "topup_sku", "display_name", "tokens_amount", "price_amount_minor", 
  "price_currency", "stripe_price_id", "is_active", "sort_order"
) VALUES 
  ('TOPUP_100', '100 Tokens', 100, 500, 'USD', 'price_topup_100', TRUE, 1),
  ('TOPUP_500', '500 Tokens', 500, 1900, 'USD', 'price_topup_500', TRUE, 2),
  ('TOPUP_2000', '2000 Tokens', 2000, 5900, 'USD', 'price_topup_2000', TRUE, 3)
ON CONFLICT ("topup_sku") DO UPDATE SET
  "display_name" = EXCLUDED."display_name",
  "tokens_amount" = EXCLUDED."tokens_amount",
  "price_amount_minor" = EXCLUDED."price_amount_minor",
  "price_currency" = EXCLUDED."price_currency",
  "stripe_price_id" = EXCLUDED."stripe_price_id",
  "is_active" = EXCLUDED."is_active",
  "sort_order" = EXCLUDED."sort_order",
  "updated_at" = now();

-- Insert default generation pricing (idempotent)
INSERT INTO "public"."generation_pricing" (
  "name", "strategy", "base_cost_tokens", "rules", "is_active", "version"
) VALUES 
  ('URL-only static v1', 'STATIC', 20, '{}'::jsonb, TRUE, 1)
ON CONFLICT DO NOTHING;