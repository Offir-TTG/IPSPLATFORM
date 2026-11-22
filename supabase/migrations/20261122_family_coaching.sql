-- Child coaching ("הילדים שלי"): children under a parent account, coaching
-- packs for a child with a coach, coaching sessions, requests from parents,
-- and coach availability for self-booking.
--
-- All tables are server-only: browsers get no access (the portal and admin
-- read and write through server routes that check who is asking).
-- Safe to run more than once.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Children: records under the parent; children don't log in.
CREATE TABLE IF NOT EXISTS public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  first_name text NOT NULL CHECK (length(trim(first_name)) > 0),
  last_name text,
  birth_year int CHECK (birth_year BETWEEN 1990 AND 2100),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_children_parent ON public.children (parent_user_id);
CREATE INDEX IF NOT EXISTS idx_children_tenant ON public.children (tenant_id);

-- A coaching pack belongs to a child and has a coach. The payer stays
-- enrollments.user_id (the parent).
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES public.children(id) ON DELETE SET NULL;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_child ON public.enrollments (child_id) WHERE child_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_coach ON public.enrollments (coach_id) WHERE coach_id IS NOT NULL;

-- Session length per session-pack product (e.g. 50 minutes).
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS session_duration_minutes int CHECK (session_duration_minutes BETWEEN 10 AND 480);

-- Coaching sessions. A coach can never have two booked sessions that
-- overlap: the database itself refuses it, so two parents can't take the
-- same slot even at the same moment.
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  coach_id uuid NOT NULL REFERENCES public.users(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  -- booked: upcoming · done · cancelled: in time, not counted ·
  -- late_cancelled: under 24h, counted as used · no_show: counted as used
  status text NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked', 'done', 'cancelled', 'late_cancelled', 'no_show')),
  booked_by uuid REFERENCES public.users(id),
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.users(id),
  zoom_meeting_id text,
  zoom_join_url text,
  zoom_start_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CONSTRAINT coaching_sessions_no_double_booking
    EXCLUDE USING gist (coach_id WITH =, tstzrange(starts_at, ends_at) WITH &&)
    WHERE (status = 'booked')
);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_enrollment ON public.coaching_sessions (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_time ON public.coaching_sessions (coach_id, starts_at);

-- Requests from parents ("I'd like coaching for my child"), handled in the admin.
CREATE TABLE IF NOT EXISTS public.coaching_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  note text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'handled')),
  handled_by uuid REFERENCES public.users(id),
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_tenant_status ON public.coaching_requests (tenant_id, status, created_at DESC);

-- Coach availability for self-booking: weekly hours (in the school's time
-- zone) and time off.
CREATE TABLE IF NOT EXISTS public.coach_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_coach_availability_coach ON public.coach_availability (coach_id);

CREATE TABLE IF NOT EXISTS public.coach_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  note text,
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_coach_time_off_coach ON public.coach_time_off (coach_id, starts_at);

-- Server-only: no browser access to any of these.
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_time_off ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.children, public.coaching_sessions, public.coaching_requests,
  public.coach_availability, public.coach_time_off FROM anon, authenticated;
