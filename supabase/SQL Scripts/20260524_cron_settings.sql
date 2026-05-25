-- Per-cron runtime control without redeploying.
--
-- The cron_settings table backs the toggle switches on /admin/crons.
-- The runCron() wrapper reads it on every tick. Flipping enabled=false
-- or dry_run=true takes effect on the NEXT tick (no rebuild needed).
--
-- Also extends cron_runs.status to allow 'skipped_disabled' so a tick
-- that fired but was DB-disabled still leaves an audit trail.

create table if not exists cron_settings (
  cron_name text primary key,
  enabled boolean not null default true,
  dry_run boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid -- nullable; populated from the API request when set via UI
);

-- Seed: one row per known cron, all enabled, all not dry-run. ON
-- CONFLICT DO NOTHING so re-running this migration doesn't clobber
-- whatever the admin most recently set in the UI.
insert into cron_settings (cron_name, enabled, dry_run) values
  ('lesson-reminders',        true, false),
  ('process-email-queue',     true, false),
  ('drain-outbox',            true, false),
  ('create-payment-invoices', true, false),
  ('retry-failed-payments',   true, false),
  ('check-overdue-payments',  true, false)
on conflict (cron_name) do nothing;

-- Allow the new 'skipped_disabled' status on cron_runs. The original
-- check constraint only knew about 'running' / 'success' / 'failed' /
-- 'skipped_dry_run' — without this an insert with the new status fails
-- and the cron itself errors out (defeating the point of the toggle).
do $$
declare
  cur_def text;
begin
  select pg_get_constraintdef(c.oid) into cur_def
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
   where t.relname = 'cron_runs'
     and c.conname = 'cron_runs_status_check';

  if cur_def is null then
    raise notice 'cron_runs_status_check not found; check that the cron_runs migration ran first';
  elsif cur_def like '%skipped_disabled%' then
    raise notice 'cron_runs_status_check already allows skipped_disabled, nothing to do';
  else
    alter table cron_runs drop constraint cron_runs_status_check;
    alter table cron_runs add constraint cron_runs_status_check
      check (status in ('running','success','failed','skipped_dry_run','skipped_disabled'));
    raise notice 'cron_runs_status_check extended to allow skipped_disabled';
  end if;
end$$;
