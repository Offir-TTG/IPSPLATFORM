-- Cleanup: webhook_secret_token must live in `credentials`, never in `settings`.
--
-- Background: an older version of the Zoom integration admin UI saved the
-- webhook secret token into the `settings` JSONB column. The Zoom webhook
-- handler later started reading the token from `settings` first, which meant
-- a stale value there shadowed the freshly-rotated value in `credentials` —
-- causing every signature check (and Zoom's URL-validation challenge) to
-- fail. The bug was already cleaned up manually for one tenant; this script
-- is the defensive global sweep for every existing row and is safe to re-run.
--
-- For each row that has `settings->>'webhook_secret_token'`:
--   1. If `credentials` is missing that key, copy the value over so we
--      don't lose the token.
--   2. Strip `webhook_secret_token` out of `settings` unconditionally.

DO $$
DECLARE
  rows_with_stray int;
  rows_copied     int;
BEGIN
  SELECT count(*) INTO rows_with_stray
  FROM public.integrations
  WHERE settings ? 'webhook_secret_token';

  -- Step 1: copy stray token into credentials when credentials lacks it.
  WITH copied AS (
    UPDATE public.integrations
    SET credentials = COALESCE(credentials, '{}'::jsonb)
                      || jsonb_build_object(
                           'webhook_secret_token',
                           settings->>'webhook_secret_token'
                         )
    WHERE settings ? 'webhook_secret_token'
      AND NOT (COALESCE(credentials, '{}'::jsonb) ? 'webhook_secret_token')
      AND length(coalesce(settings->>'webhook_secret_token', '')) > 0
    RETURNING 1
  )
  SELECT count(*) INTO rows_copied FROM copied;

  -- Step 2: strip the key out of settings on every row that has it.
  UPDATE public.integrations
  SET settings = settings - 'webhook_secret_token'
  WHERE settings ? 'webhook_secret_token';

  RAISE NOTICE 'integrations cleanup: % rows had stray settings.webhook_secret_token, % token(s) copied into credentials, all stripped from settings.',
    rows_with_stray, rows_copied;
END $$;
