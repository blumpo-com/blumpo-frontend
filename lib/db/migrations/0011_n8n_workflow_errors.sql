-- Migration: Add n8n workflow errors tables for storing aggregated errors and occurrences
-- Idempotent migration following project conventions

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."n8n_workflow_errors" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"workflow_name" text,
	"node_id" text NOT NULL,
	"node_name" text,
	"node_type" text,
	"node_type_version" integer,
	"error_name" text,
	"error_level" text,
	"error_message" text NOT NULL,
	"error_fingerprint" text NOT NULL,
	"occurrences_count" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"last_execution_id" text,
	"last_execution_url" text,
	"last_node_executed" text,
	"sample_stack" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_n8n_workflow_errors_fingerprint'
  ) THEN
    ALTER TABLE "public"."n8n_workflow_errors" ADD CONSTRAINT "uq_n8n_workflow_errors_fingerprint" UNIQUE("error_fingerprint");
  END IF;
END $$;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."n8n_workflow_error_occurrences" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"error_id" bigint NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"execution_id" text,
	"execution_url" text,
	"mode" text,
	"source" text,
	"stack" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'n8n_workflow_error_occurrences_error_id_n8n_workflow_errors_id_fk'
  ) THEN
    ALTER TABLE "public"."n8n_workflow_error_occurrences" ADD CONSTRAINT "n8n_workflow_error_occurrences_error_id_n8n_workflow_errors_id_fk" FOREIGN KEY ("error_id") REFERENCES "public"."n8n_workflow_errors"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_n8n_workflow_errors_workflow_id" ON "public"."n8n_workflow_errors" USING btree ("workflow_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_n8n_workflow_errors_node_id" ON "public"."n8n_workflow_errors" USING btree ("node_id");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_n8n_workflow_errors_resolved_time" ON "public"."n8n_workflow_errors" USING btree ("is_resolved","last_seen_at" DESC NULLS LAST);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_n8n_workflow_errors_level_time" ON "public"."n8n_workflow_errors" USING btree ("error_level","last_seen_at" DESC NULLS LAST);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_n8n_workflow_error_occurrences_error_time" ON "public"."n8n_workflow_error_occurrences" USING btree ("error_id","occurred_at" DESC NULLS LAST);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_n8n_workflow_error_occurrences_occurred_at" ON "public"."n8n_workflow_error_occurrences" USING btree ("occurred_at" DESC NULLS LAST);
