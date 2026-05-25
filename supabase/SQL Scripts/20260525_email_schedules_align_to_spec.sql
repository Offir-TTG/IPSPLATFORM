-- Align production `email_schedules` to the full spec declared in
-- `20251202_email_system_core.sql`. Production was created from an
-- older / partial version of that spec, so every save attempt errors
-- out with PGRST204 for one column after another. Rather than trim
-- the dialog round-by-round, this script adds EVERY column the spec
-- defines — IF NOT EXISTS, so it's safe on a full schema or a
-- partial one.

ALTER TABLE public.email_schedules
  -- Schedule metadata
  ADD COLUMN IF NOT EXISTS schedule_name        TEXT,
  ADD COLUMN IF NOT EXISTS description          TEXT,
  ADD COLUMN IF NOT EXISTS template_id          UUID REFERENCES public.email_templates(id) ON DELETE CASCADE,

  -- Recipients
  ADD COLUMN IF NOT EXISTS recipient_filter     JSONB,
  ADD COLUMN IF NOT EXISTS recipient_ids        UUID[],
  ADD COLUMN IF NOT EXISTS recipient_count      INTEGER DEFAULT 0,

  -- Timing
  ADD COLUMN IF NOT EXISTS scheduled_for        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone             TEXT DEFAULT 'UTC',

  -- Recurrence
  ADD COLUMN IF NOT EXISTS recurrence_rule      TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date  TIMESTAMPTZ,

  -- Template variables shared across all recipients
  ADD COLUMN IF NOT EXISTS template_variables   JSONB,

  -- Status
  ADD COLUMN IF NOT EXISTS status               TEXT DEFAULT 'pending',

  -- Counters
  ADD COLUMN IF NOT EXISTS emails_queued        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_sent          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_failed        INTEGER DEFAULT 0,

  -- Lifecycle timestamps (used by the send-worker cron)
  ADD COLUMN IF NOT EXISTS started_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message        TEXT,

  -- Audit trail
  ADD COLUMN IF NOT EXISTS created_by           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ DEFAULT now();

-- Status check constraint (idempotent — drop then re-add).
ALTER TABLE public.email_schedules DROP CONSTRAINT IF EXISTS email_schedules_status_check;
ALTER TABLE public.email_schedules
  ADD CONSTRAINT email_schedules_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed'));

-- Indexes (already in the spec but IF NOT EXISTS keeps the script safe).
CREATE INDEX IF NOT EXISTS idx_email_schedules_status     ON public.email_schedules(status);
CREATE INDEX IF NOT EXISTS idx_email_schedules_scheduled  ON public.email_schedules(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_schedules_template   ON public.email_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_email_schedules_created_by ON public.email_schedules(created_by) WHERE created_by IS NOT NULL;

-- Refresh PostgREST so the new columns are visible immediately.
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE 'email_schedules fully aligned to spec. Re-run if any column was added.';
END $$;
