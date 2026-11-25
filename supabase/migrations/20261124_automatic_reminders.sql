-- Automatic reminders: one place for every message the system sends by itself.
--
--   message_settings  the school's sending hours, Shabbat and holidays, and
--                     the daily summary time (one row per school)
--   chasers           a reminder: what starts it, its status, when it stops
--   chaser_steps      the messages of a reminder, each at an offset from the
--                     moment that started it (negative = before, e.g. a meeting)
--   chaser_runs       one reminder running for one client and one case
--                     (a failed payment, a meeting, an unsigned contract)
--   message_log       every message sent to a client or the team, and how it
--                     arrived: email and bell, bell only (and why), waiting
--                     for quiet hours to end, in the daily summary, stopped,
--                     or an email that did not arrive
--   digest_items      updates waiting for a client's daily summary email
--
-- Every message goes through one check of the client's settings
-- (notification_preferences) before it leaves; see src/lib/messaging.
--
-- Server-only, like the other admin tables: the app reads and writes these
-- with the service role after checking the user. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.message_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  send_from time NOT NULL DEFAULT '09:00',
  send_until time NOT NULL DEFAULT '20:00',
  skip_shabbat boolean NOT NULL DEFAULT true,
  digest_time time NOT NULL DEFAULT '18:00',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  CHECK (send_from < send_until)
);

CREATE TABLE IF NOT EXISTS public.chasers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- What starts it, from the catalogue in src/lib/messaging/catalog.ts,
  -- e.g. 'payment.failed', 'lesson.before', 'enrollment.incomplete'.
  event_key text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'off')),
  -- 'new': only cases that start after it was turned on. 'all': also cases
  -- already open when it was turned on.
  applies_to text NOT NULL DEFAULT 'new' CHECK (applies_to IN ('new', 'all')),
  -- Also tell the team (every admin) at each step.
  admin_copy boolean NOT NULL DEFAULT false,
  -- Stop conditions, from the catalogue (e.g. 'paid', 'card_updated').
  stop_on text[] NOT NULL DEFAULT '{}',
  -- Only these products; empty = every product, also ones added later.
  product_ids uuid[],
  -- This reminder's own sending hours and Shabbat rule; empty = the school's.
  send_from time,
  send_until time,
  skip_shabbat boolean,
  -- Seeded by the system. Can be edited and turned off, not deleted.
  is_system boolean NOT NULL DEFAULT false,
  activated_at timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_chasers_system_event
  ON public.chasers (tenant_id, event_key) WHERE is_system;
CREATE INDEX IF NOT EXISTS idx_chasers_tenant_status ON public.chasers (tenant_id, status);

CREATE TABLE IF NOT EXISTS public.chaser_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  chaser_id uuid NOT NULL REFERENCES public.chasers(id) ON DELETE CASCADE,
  position int NOT NULL CHECK (position >= 1),
  -- Minutes from the moment that started it. -1440 = a day before a
  -- meeting; 4320 = three days after a failed payment.
  offset_minutes int NOT NULL DEFAULT 0,
  -- The bell always gets it. This decides whether email is also tried
  -- (and then the client's settings decide).
  send_email boolean NOT NULL DEFAULT true,
  -- A short copy to every admin when this step goes out.
  admin_copy boolean NOT NULL DEFAULT false,
  -- The button in the message, from the catalogue (update_card, join, ...).
  action_key text,
  title_he text NOT NULL,
  -- Simple HTML from the editor, with {placeholders} like {שם} or {name}.
  body_he text NOT NULL,
  title_en text,
  body_en text,
  action_label_he text,
  action_label_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chaser_id, position)
);

CREATE TABLE IF NOT EXISTS public.chaser_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  chaser_id uuid NOT NULL REFERENCES public.chasers(id) ON DELETE CASCADE,
  -- The case, e.g. ('payment_schedule', <id>), ('lesson', <id>).
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  -- The moment the steps count from (the failure, the meeting start).
  anchor_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'stopped')),
  stop_reason text,
  next_position int NOT NULL DEFAULT 1,
  next_at timestamptz,
  -- Details the messages fill in ({{amount}}, {{lessonTitle}}, ...).
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- One run per reminder, client and case (a meeting moved to a new time is a
-- new anchor, so it gets a new run).
CREATE UNIQUE INDEX IF NOT EXISTS uq_chaser_runs_case
  ON public.chaser_runs (chaser_id, subject_type, subject_id, user_id, anchor_at);
CREATE INDEX IF NOT EXISTS idx_chaser_runs_due
  ON public.chaser_runs (next_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_chaser_runs_user ON public.chaser_runs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  to_email text,
  -- Where it came from.
  source text NOT NULL CHECK (source IN
    ('reminder', 'trigger', 'coaching', 'team_alert', 'system', 'manual', 'price_change', 'digest', 'scheduled', 'contact')),
  chaser_id uuid REFERENCES public.chasers(id) ON DELETE SET NULL,
  step_id uuid REFERENCES public.chaser_steps(id) ON DELETE SET NULL,
  run_id uuid REFERENCES public.chaser_runs(id) ON DELETE SET NULL,
  -- The client's settings group (lesson, payment, enrollment, ...).
  category text,
  title text NOT NULL,
  -- How it arrived.
  outcome text NOT NULL CHECK (outcome IN
    ('email_and_bell', 'bell_only', 'email_only', 'waiting', 'in_digest', 'stopped', 'email_failed')),
  -- Why, when it isn't plain email and bell: email_off, quiet_hours,
  -- time_sensitive, digest, send_hours, shabbat, no_email, blocked, bounced,
  -- inactive, or a stop condition.
  reason text,
  notification_id uuid,
  email_queue_id uuid,
  -- When the email is due to leave (quiet hours, sending hours).
  send_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_message_log_tenant_time ON public.message_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_log_user_time ON public.message_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_log_chaser ON public.message_log (chaser_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_log_queue ON public.message_log (email_queue_id) WHERE email_queue_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.digest_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text,
  title text NOT NULL,
  body text,
  action_url text,
  action_label text,
  message_log_id uuid REFERENCES public.message_log(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_digest_items_waiting ON public.digest_items (user_id, created_at) WHERE sent_at IS NULL;

-- An email in the queue knows which log row to update when it is sent,
-- refused or bounces.
ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS message_log_id uuid;
CREATE INDEX IF NOT EXISTS idx_email_queue_message_log ON public.email_queue (message_log_id) WHERE message_log_id IS NOT NULL;

ALTER TABLE public.message_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chasers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chaser_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chaser_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.message_settings, public.chasers, public.chaser_steps, public.chaser_runs,
  public.message_log, public.digest_items FROM anon, authenticated;
