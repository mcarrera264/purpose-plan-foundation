
-- Convert enum status columns to text to allow extended states without enum rewrites
ALTER TABLE public.ai_suggestion_batches ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.ai_suggestion_batches ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.ai_suggestion_batches ALTER COLUMN status SET DEFAULT 'queued';
ALTER TABLE public.ai_suggestion_batches
  ADD CONSTRAINT ai_suggestion_batches_status_chk
  CHECK (status IN ('queued','preparing','generating','needs_context','completed','failed','cancelled','pending'));

ALTER TABLE public.ai_suggestions ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.ai_suggestions ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.ai_suggestions ALTER COLUMN status SET DEFAULT 'proposed';
ALTER TABLE public.ai_suggestions
  ADD CONSTRAINT ai_suggestions_status_chk
  CHECK (status IN ('proposed','edited','rejected','accepted','pending'));

-- Extend ai_suggestion_batches
ALTER TABLE public.ai_suggestion_batches
  ADD COLUMN IF NOT EXISTS capability text CHECK (capability IN ('generate_project_tasks','decompose_task')),
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_depth int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_context text,
  ADD COLUMN IF NOT EXISTS attempt_number int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS request_id text,
  ADD COLUMN IF NOT EXISTS failure_code text,
  ADD COLUMN IF NOT EXISTS notice text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS supersedes_batch_id uuid REFERENCES public.ai_suggestion_batches(id) ON DELETE SET NULL;

-- Extend ai_suggestions
ALTER TABLE public.ai_suggestions
  ADD COLUMN IF NOT EXISTS original_title text,
  ADD COLUMN IF NOT EXISTS original_description text,
  ADD COLUMN IF NOT EXISTS edited_title text,
  ADD COLUMN IF NOT EXISTS edited_description text,
  ADD COLUMN IF NOT EXISTS position int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS suggested_depth int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_duplicate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Ensure result_task_id is unique (idempotency: at most one task per suggestion)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_suggestions_result_task_id_key'
  ) THEN
    ALTER TABLE public.ai_suggestions ADD CONSTRAINT ai_suggestions_result_task_id_key UNIQUE (result_task_id);
  END IF;
END $$;

-- Backfill original_title from title where null
UPDATE public.ai_suggestions SET original_title = title WHERE original_title IS NULL;

-- Index for quota lookups
CREATE INDEX IF NOT EXISTS ai_batches_user_created_idx
  ON public.ai_suggestion_batches (user_id, created_at DESC);
