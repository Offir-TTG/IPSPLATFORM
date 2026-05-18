-- =====================================================================
-- Shared Person Identity — IPSPlatform side.
--
-- Adds the durable cross-platform contract:
--   • users.person_id (uuid, nullable) — the foreign key into
--     IParentingSchool's crm_contacts.id. Stamped at registration time
--     (either decoded from a signed token on the redirect URL, or
--     fetched via the cross-app get-or-create endpoint).
--   • external_persons — local read-only projection of persons known to
--     IParentingSchool but not yet registered on IPSPlatform. Lets
--     IPSPlatform resolve a Register-direct flow against an existing
--     person identity (especially after a legacy-CRM bulk import).
--   • outbox_events — durable queue of state changes to deliver to
--     IParentingSchool (person.enrolled, person.became_customer,
--     person.enrollment_pending fallback, etc.).
--   • inbound_events — idempotency table for events arriving FROM
--     IParentingSchool.
--
-- Idempotent. See plan: structured-conjuring-lake.md
-- =====================================================================

-- ─── users: cross-platform identity columns ──────────────────────────
alter table public.users
  add column if not exists person_id uuid,
  -- Mirrors of IParentingSchool's crm_contacts.source_updated_at +
  -- version. Used by the inbound handler to drop stale events.
  add column if not exists person_source_updated_at timestamptz,
  add column if not exists person_version bigint;

-- Unique constraint scoped to non-null rows: many users still have
-- person_id NULL during the eventually-consistent pending window after
-- a Register-direct flow when IParentingSchool was unreachable.
create unique index if not exists users_person_id_uidx
  on public.users (person_id) where person_id is not null;

comment on column public.users.person_id is
  'Foreign reference to IParentingSchool crm_contacts.id. Source of truth for cross-platform identity. Stamped at registration; NULL only during a transient "enrollment_pending" window when the cross-app call was unreachable.';
comment on column public.users.person_source_updated_at is
  'Mirror of crm_contacts.source_updated_at at the time of the last inbound event. Used to drop out-of-order replays.';
comment on column public.users.person_version is
  'Mirror of crm_contacts.version at the time of the last inbound event.';

-- ─── external_persons (projection) ───────────────────────────────────
-- Persons known to IParentingSchool but not yet registered on IPSPlatform.
-- Populated by inbound person.upserted / persons.bulk_upserted events.
-- When such a person later registers, the credential-creation handler
-- matches them by email and stamps users.person_id = external_persons.person_id.
create table if not exists public.external_persons (
  person_id           uuid primary key,
  email               text not null,
  email_lower         text generated always as (lower(email)) stored,
  first_name          text,
  last_name           text,
  phone               text,
  country             text,
  locale              text,
  marketing_opt_in    boolean not null default false,
  lifecycle_stage     text,
  source_updated_at   timestamptz not null,
  version             bigint not null,
  archived_at         timestamptz,
  received_at         timestamptz not null default now(),
  -- Set when the external person eventually registers on IPSPlatform
  -- and a public.users row is created and linked. After this, the
  -- users row is the live one; external_persons remains as long-term
  -- audit / cache of the IParentingSchool projection.
  linked_user_id      uuid references public.users(id) on delete set null
);

-- Case-insensitive uniqueness on email.
create unique index if not exists external_persons_email_lower_uidx
  on public.external_persons (email_lower);

comment on table public.external_persons is
  'Local read-only projection of IParentingSchool persons. Pre-seeds the join when an externally-known person registers on IPSPlatform; survives forever as audit of the IParentingSchool snapshot at last sync.';

-- ─── outbox_events ───────────────────────────────────────────────────
-- Durable queue of state changes to deliver to IParentingSchool.
create table if not exists public.outbox_events (
  id              uuid primary key default gen_random_uuid(),
  event_type      text not null,            -- person.enrolled | person.became_customer | person.enrollment_pending | person.email_changed
  person_id       uuid,                     -- nullable: enrollment_pending sets only user_id
  user_id         uuid references public.users(id) on delete cascade,
  payload         jsonb not null,
  created_at      timestamptz not null default now(),
  delivered_at    timestamptz,
  attempts        int not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error      text,
  dead_letter     boolean not null default false
);

create index if not exists outbox_pending_idx
  on public.outbox_events (next_attempt_at, created_at)
  where delivered_at is null and dead_letter = false;

create index if not exists outbox_dead_letter_idx
  on public.outbox_events (created_at desc)
  where dead_letter = true;

comment on table public.outbox_events is
  'Durable outbound event queue. Drainer cron POSTs each row to IParentingSchool inbound; marks delivered_at on 2xx; backs off + retries on 4xx/5xx; dead-letters after 12 attempts.';

-- ─── inbound_events (idempotency) ────────────────────────────────────
create table if not exists public.inbound_events (
  event_id    uuid primary key,
  source      text not null,                -- 'iparentingschool'
  event_type  text not null,
  received_at timestamptz not null default now()
);

comment on table public.inbound_events is
  'Idempotency table for events received FROM IParentingSchool. The event_id PK rejects duplicate replays.';

-- ─── RLS ──────────────────────────────────────────────────────────────
-- These tables are not meant to be queried by end-users. Drainer +
-- inbound endpoints use the service-role client and bypass RLS; the
-- policies below exist as defence-in-depth against a misconfigured
-- admin query leaking outbox payloads (which may contain emails).
alter table public.external_persons enable row level security;
alter table public.outbox_events    enable row level security;
alter table public.inbound_events   enable row level security;

drop policy if exists "external_persons admin all" on public.external_persons;
create policy "external_persons admin all" on public.external_persons
  for all using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

drop policy if exists "outbox_events admin all" on public.outbox_events;
create policy "outbox_events admin all" on public.outbox_events
  for all using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

drop policy if exists "inbound_events admin all" on public.inbound_events;
create policy "inbound_events admin all" on public.inbound_events
  for all using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );
