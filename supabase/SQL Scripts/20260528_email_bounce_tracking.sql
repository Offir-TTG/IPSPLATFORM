-- 2026-05-28: Hard-bounce tracking on email_queue.
--
-- When an SMTP send fails permanently (5xx response, no MX, "no such
-- user"), `process-email-queue` now classifies the failure via
-- src/lib/email/bounce.ts and writes the result into `bounce_type`.
-- The `is_email_hard_bounced()` function + partial index let
-- `isEmailDeliverable()` short-circuit future sends to the same
-- address with one index probe.
--
-- Manual unblock (after the user has fixed their address):
--
--   UPDATE email_queue SET bounce_type = NULL
--   WHERE lower(to_email) = lower('foo@bar.com') AND bounce_type = 'hard';
--
-- IMPORTANT for any future archival job:
--   Do NOT archive rows where bounce_type IS NOT NULL. They are the
--   only record of which addresses we won't send to. The partial index
--   relies on them being present.

ALTER TABLE email_queue
  ADD COLUMN IF NOT EXISTS bounce_type TEXT
    CHECK (bounce_type IN ('hard', 'soft', 'complaint'));

COMMENT ON COLUMN email_queue.bounce_type IS
  'Set by process-email-queue when SMTP rejects the send. ''hard'' marks the recipient as undeliverable for all future sends via is_email_hard_bounced() + the partial index on lower(to_email).';

-- Partial index — only stores rows that are currently hard-bouncing.
-- Stays tiny (one row per bad address) regardless of queue volume.
-- The expression matches `lower(to_email) = lower(p_email)` in the
-- function below.
CREATE INDEX IF NOT EXISTS idx_email_queue_hard_bounce
  ON email_queue (lower(to_email))
  WHERE bounce_type = 'hard';

-- Single-roundtrip eligibility probe used by isEmailDeliverable().
-- Inlined in SQL so the planner can use the partial index above
-- (a PostgREST `ilike` filter would force a scan).
CREATE OR REPLACE FUNCTION is_email_hard_bounced(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM email_queue
    WHERE lower(to_email) = lower(p_email)
      AND bounce_type = 'hard'
    LIMIT 1
  );
$$;

GRANT EXECUTE ON FUNCTION is_email_hard_bounced(TEXT) TO authenticated, service_role;
