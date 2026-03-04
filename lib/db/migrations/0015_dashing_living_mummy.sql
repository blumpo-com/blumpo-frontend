CREATE TABLE "token_account_promotion" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"token_account_id" uuid NOT NULL,
	"promotion_key" text NOT NULL,
	"stripe_promotion_code_id" text,
	"stripe_coupon_id" text,
	"status" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "token_account_promotion" ADD CONSTRAINT "token_account_promotion_token_account_id_token_account_user_id_fk" FOREIGN KEY ("token_account_id") REFERENCES "public"."token_account"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_token_account_promotion_account_key" ON "token_account_promotion" USING btree ("token_account_id","promotion_key");