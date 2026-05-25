-- Add 'paused' as a valid status for email_schedules and a
-- timestamp column for when the pause happened. Paused is a
-- non-terminal state — the admin can resume a paused schedule to
-- bring it back to 'pending' and have the cron continue from there.
-- Safe to re-run.

ALTER TABLE public.email_schedules
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;

-- Relax the status check constraint so 'paused' is allowed.
-- The constraint name varies by schema version, so drop ALL existing
-- check constraints on `status` first, then re-add the canonical one.
DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.email_schedules'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.email_schedules DROP CONSTRAINT %I', con.conname);
  END LOOP;

  ALTER TABLE public.email_schedules
    ADD CONSTRAINT email_schedules_status_check
    CHECK (status IN ('pending', 'processing', 'paused', 'completed', 'cancelled', 'failed'));
END $$;

NOTIFY pgrst, 'reload schema';
