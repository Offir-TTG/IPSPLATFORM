-- Relax payment_schedules so off-schedule manual payments can be
-- mirrored as a "paid" row in the schedules list.
--
-- Two constraint changes:
--   * payment_plan_id → nullable. Manual entries don't belong to a
--     payment plan (no installment cadence to follow). Original schema
--     required it because every row was Stripe/plan-driven.
--   * payment_type CHECK gains 'manual'. Other values
--     ('deposit','installment','subscription','full') keep working.
--
-- After this + the recordStandalonePayment service change, every
-- off-schedule payment also writes a payment_schedules row with
-- status='paid', payment_type='manual', so it appears in the same list
-- and is filterable.

-- Drop NOT NULL on payment_plan_id.
ALTER TABLE public.payment_schedules
  ALTER COLUMN payment_plan_id DROP NOT NULL;

-- Replace the payment_type CHECK to include 'manual'.
DO $$
DECLARE
  cur_def text;
BEGIN
  SELECT pg_get_constraintdef(c.oid) INTO cur_def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
   WHERE t.relname = 'payment_schedules'
     AND c.conname = 'payment_schedules_payment_type_check';

  IF cur_def IS NULL THEN
    RAISE NOTICE 'payment_schedules_payment_type_check not found; skipping';
  ELSIF cur_def LIKE '%manual%' THEN
    RAISE NOTICE 'payment_schedules_payment_type_check already allows manual';
  ELSE
    ALTER TABLE public.payment_schedules
      DROP CONSTRAINT payment_schedules_payment_type_check;
    ALTER TABLE public.payment_schedules
      ADD CONSTRAINT payment_schedules_payment_type_check
        CHECK (payment_type IN ('deposit', 'installment', 'subscription', 'full', 'manual'));
    RAISE NOTICE 'payment_schedules_payment_type_check extended to allow manual';
  END IF;
END$$;

NOTIFY pgrst, 'reload schema';
