-- Cron observability: every cron tick logs a row so a future runaway
-- (e.g. the lesson-reminder dedup failing and re-enqueueing) is visible
-- the moment it starts, not after 1000 emails. Pair with the helper at
-- src/lib/cron/withCronLogging.ts.

create table if not exists cron_runs (
  id uuid primary key default gen_random_uuid(),
  cron_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  status text not null check (status in ('running','success','failed','skipped_dry_run')),
  -- Summary is whatever the cron returns (e.g. {processed: 12, queued: 4}).
  -- Stored as jsonb so we can grep/aggregate later without parsing strings.
  summary jsonb,
  error_message text,
  -- Mirrors the CRON_DRY_RUN env var that was in effect at run time. Lets
  -- ops verify a re-enable rollout actually went live.
  dry_run boolean not null default false
);

-- Most queries are "show me recent runs for cron X" — composite index
-- supports both ORDER BY started_at DESC and the cron_name filter.
create index if not exists idx_cron_runs_name_started
  on cron_runs (cron_name, started_at desc);

-- Retention: keep 30 days. cron_runs grows fast (drain-outbox alone is
-- 1440 rows/day). Older rows are not useful for ops and add table-scan
-- cost. Adjust if you ever need long-term audit.
create or replace function prune_cron_runs() returns void
language sql security definer
as $$
  delete from cron_runs where started_at < now() - interval '30 days';
$$;
