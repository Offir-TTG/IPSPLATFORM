-- Per-tenant portal base URL.
--
-- Email links that point to the user portal (e.g. the "Watch
-- recording" button on recording.available) need an absolute URL
-- because emails render outside the browser context where relative
-- paths are useless. Previously we hard-coded
-- `${NEXT_PUBLIC_APP_URL}/courses/${id}` which forces a redeploy
-- every time the production domain changes.
--
-- Storing the base URL on the tenant lets the admin flip it from
-- /admin/emails/settings without code/env changes when moving from
-- staging to production, or when a tenant is on a custom domain.
--
-- Webhook code reads `tenant.portal_url` first; if NULL it still
-- falls back to NEXT_PUBLIC_APP_URL so existing tenants keep
-- working until they set their own.
--
-- Safe to re-run.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS portal_url TEXT;

COMMENT ON COLUMN public.tenants.portal_url IS
  'Absolute base URL of the user portal (e.g. https://app.example.com). Used to build email links like {recordingUrl} so production-vs-staging URLs are admin-controllable. NULL = fall back to NEXT_PUBLIC_APP_URL env var.';

NOTIFY pgrst, 'reload schema';
