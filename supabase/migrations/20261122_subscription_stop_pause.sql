-- Membership stop and pause from the client portal.
--   subscription_ends_at       set when the client stops: no more charges,
--                              access until this date (end of the paid period),
--                              then the enrollment is closed automatically.
--   subscription_paused_from   a one-month pause: no charge and no access
--   subscription_paused_until  between these dates; billing resumes after.
-- Safe to run more than once.

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS subscription_paused_from timestamptz;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS subscription_paused_until timestamptz;

-- The hourly job looks for memberships whose end date has passed.
CREATE INDEX IF NOT EXISTS idx_enrollments_subscription_ends_at
  ON public.enrollments (subscription_ends_at) WHERE subscription_ends_at IS NOT NULL;
