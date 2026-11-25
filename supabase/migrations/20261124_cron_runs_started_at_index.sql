-- Cron runs: an index on started_at alone.
--
-- The only index was (cron_name, started_at), which can't serve a search by
-- date alone. Deleting a date window from the Crons page (and the 30-day
-- prune_cron_runs) had to read the whole table, about 170,000 rows, and ran
-- past the statement timeout. With this index they read only the window.
-- Safe to rerun.
create index if not exists idx_cron_runs_started
  on public.cron_runs (started_at);
