-- Add `log_runs` to cron_settings so the admin can suppress
-- cron_runs inserts for chatty / low-value crons (e.g. drain-outbox
-- ticks every minute and accounts for the bulk of the table). Default
-- true so existing behaviour is preserved on rollout; the admin
-- toggles it off from /admin/crons for any cron whose runs don't
-- need to be retained.
-- Safe to re-run.

ALTER TABLE public.cron_settings
  ADD COLUMN IF NOT EXISTS log_runs BOOLEAN NOT NULL DEFAULT true;

NOTIFY pgrst, 'reload schema';
