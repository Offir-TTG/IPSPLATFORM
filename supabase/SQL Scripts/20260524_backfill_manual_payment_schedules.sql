-- Backfill: create a synthetic `payment_schedules` row for any
-- previously-recorded standalone (off-schedule) manual payment that
-- doesn't already have one linked.
--
-- These are `payments` rows where:
--   metadata->>'payment_type' = 'manual_standalone'
--   enrollment_id IS NOT NULL
--   no payment_schedules row points to this payment_id yet
--
-- Without this, payments recorded BEFORE the synthetic-schedule code
-- shipped won't appear in the schedules list (only future ones will).
--
-- Safe to re-run: the NOT EXISTS guard prevents duplicates. Requires
-- the payment_schedules_allow_manual migration to have run first
-- (otherwise the CHECK constraint rejects payment_type='manual').

WITH backfill_targets AS (
  SELECT
    p.id            AS payment_id,
    p.tenant_id,
    p.enrollment_id,
    p.amount,
    p.currency,
    p.created_at    AS payment_at,
    -- Next available payment_number for this enrollment so the
    -- UNIQUE(enrollment_id, payment_number) constraint holds.
    COALESCE(
      (SELECT MAX(ps.payment_number) FROM payment_schedules ps
        WHERE ps.enrollment_id = p.enrollment_id),
      0
    ) + 1            AS next_payment_number
  FROM payments p
  WHERE p.metadata->>'payment_type' = 'manual_standalone'
    AND p.enrollment_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payment_schedules ps
      WHERE ps.payment_id = p.id
    )
)
INSERT INTO payment_schedules (
  tenant_id, enrollment_id, payment_plan_id,
  payment_number, payment_type,
  amount, currency,
  original_due_date, scheduled_date, paid_date,
  status, payment_id
)
SELECT
  tenant_id, enrollment_id, NULL,
  next_payment_number, 'manual',
  amount, COALESCE(currency, 'USD'),
  payment_at, payment_at, payment_at,
  'paid', payment_id
FROM backfill_targets;

-- Report how many rows were backfilled.
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % synthetic schedule row(s) for standalone manual payments', inserted_count;
END$$;
