CREATE TABLE IF NOT EXISTS "newsletter_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"user_id" uuid,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "newsletter_subscription_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ad_image' AND column_name = 'permanently_deleted') THEN
		ALTER TABLE "ad_image" ADD COLUMN "permanently_deleted" boolean DEFAULT false NOT NULL;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_name = 'newsletter_subscription_user_id_user_id_fk') THEN
		ALTER TABLE "newsletter_subscription" ADD CONSTRAINT "newsletter_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
