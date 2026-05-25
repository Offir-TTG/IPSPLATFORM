-- Add `language_code` to email_schedules so an admin can pin a
-- schedule to one language (e.g. all recipients receive the Hebrew
-- body even if their profile language is English). If left NULL the
-- send-worker falls back to each recipient's preferred_language.
-- Safe to re-run.

ALTER TABLE public.email_schedules
  ADD COLUMN IF NOT EXISTS language_code TEXT;

COMMENT ON COLUMN public.email_schedules.language_code IS
  'Optional language override. When set (''en'' / ''he''), every recipient receives the email rendered in that language regardless of their profile preference. NULL = use recipient.preferred_language.';

-- Tell PostgREST to refresh its schema cache so the new column is
-- selectable / insertable from the API layer immediately.
NOTIFY pgrst, 'reload schema';
