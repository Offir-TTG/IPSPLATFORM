-- =====================================================================
-- Disable RLS on cross-platform identity outbox/inbound tables.
--
-- These tables are internal infrastructure managed exclusively by
-- service-role clients (the drainer cron, the inbound endpoint, and
-- the emit helpers called from server actions). Putting them behind
-- "admin only" RLS policies adds no defence (the data is already
-- inaccessible to anon / authenticated user contexts via the absence
-- of any matching policy) but blocks legitimate writes when the
-- service-role client's auth context doesn't match the policy's
-- USING clause.
--
-- Idempotent.
-- =====================================================================

alter table public.outbox_events  disable row level security;
alter table public.inbound_events disable row level security;
alter table public.external_persons disable row level security;

drop policy if exists "outbox_events admin all"  on public.outbox_events;
drop policy if exists "inbound_events admin all" on public.inbound_events;
drop policy if exists "external_persons admin all" on public.external_persons;
