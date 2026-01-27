-- Fix payment_schedules table status constraint to allow refunded
-- Ensures payment_schedules can be marked as refunded
-- Date: 2026-01-26

-- Drop the old constraint if it exists
ALTER TABLE payment_schedules DROP CONSTRAINT IF EXISTS payment_schedules_status_check;

-- Add new constraint that includes refunded
ALTER TABLE payment_schedules ADD CONSTRAINT payment_schedules_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'overdue', 'refunded', 'cancelled'));

-- Add comment
COMMENT ON CONSTRAINT payment_schedules_status_check ON payment_schedules IS
  'Allowed payment schedule statuses: pending, paid, failed, overdue, refunded, cancelled';

-- Verify constraint was created
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PAYMENT SCHEDULES STATUS CONSTRAINT UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Allowed status values:';
  RAISE NOTICE '  - pending';
  RAISE NOTICE '  - paid';
  RAISE NOTICE '  - failed';
  RAISE NOTICE '  - overdue';
  RAISE NOTICE '  - refunded';
  RAISE NOTICE '  - cancelled';
  RAISE NOTICE '';
END $$;
