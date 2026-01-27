-- Fix payments table status constraint to allow partially_refunded
-- Fixes error: new row for relation "payments" violates check constraint "payments_status_check"
-- Also normalizes 'succeeded' to 'paid' for consistency
-- Date: 2026-01-26

-- IMPORTANT: Must drop constraint BEFORE updating data, otherwise the old constraint blocks the update

-- Step 1: Drop the old constraint first (allows us to update the data)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Step 2: Normalize any 'succeeded' status to 'paid' (from old webhook code)
UPDATE payments SET status = 'paid' WHERE status = 'succeeded';

-- Step 3: Add new constraint that includes partially_refunded
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

-- Step 4: Add comment
COMMENT ON CONSTRAINT payments_status_check ON payments IS
  'Allowed payment statuses: pending, paid, failed, refunded, partially_refunded';

-- Verify constraint was created
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PAYMENTS STATUS CONSTRAINT FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  1. Dropped old constraint (was: pending, succeeded, failed, refunded)';
  RAISE NOTICE '  2. Normalized "succeeded" to "paid"';
  RAISE NOTICE '  3. Added new constraint (now: pending, paid, failed, refunded, partially_refunded)';
  RAISE NOTICE '';
  RAISE NOTICE 'Allowed status values:';
  RAISE NOTICE '  - pending';
  RAISE NOTICE '  - paid';
  RAISE NOTICE '  - failed';
  RAISE NOTICE '  - refunded';
  RAISE NOTICE '  - partially_refunded';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now use partially_refunded status!';
  RAISE NOTICE '';
END $$;
