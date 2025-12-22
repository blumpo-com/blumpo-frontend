-- Migration: Add workflow_ctx column to generation_job
-- This migration:
-- 1. Adds workflow_ctx jsonb column with default '{}'
-- 2. Adds check constraint to ensure shape when not empty
-- 3. Adds indexes on workflow_code and execution_id

--> statement-breakpoint
-- Add workflow_ctx column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'generation_job' 
    AND column_name = 'workflow_ctx'
  ) THEN
    ALTER TABLE "public"."generation_job"
      ADD COLUMN "workflow_ctx" jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

--> statement-breakpoint
-- Add check constraint for workflow_ctx shape (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND constraint_name = 'generation_job_workflow_ctx_shape_chk'
  ) THEN
    ALTER TABLE "public"."generation_job"
      ADD CONSTRAINT "generation_job_workflow_ctx_shape_chk"
      CHECK (
        workflow_ctx = '{}'::jsonb
        OR (
          workflow_ctx ? 'execution_id'
          AND workflow_ctx ? 'workflow_code'
          AND workflow_ctx ? 'callback_url'
        )
      );
  END IF;
END $$;

--> statement-breakpoint
-- Add index on workflow_code (idempotent)
CREATE INDEX IF NOT EXISTS "idx_generation_job_workflow_code" 
ON "public"."generation_job" ((workflow_ctx->>'workflow_code'));

--> statement-breakpoint
-- Add index on execution_id (idempotent)
CREATE INDEX IF NOT EXISTS "idx_generation_job_execution_id" 
ON "public"."generation_job" (((workflow_ctx->>'execution_id')::bigint));

