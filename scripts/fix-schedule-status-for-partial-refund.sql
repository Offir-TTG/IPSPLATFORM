-- Fix schedule status for partial refund
-- Schedule should remain 'paid' for partial refunds, only 'refunded' for full refunds

-- Check current status
SELECT
  id,
  status,
  amount,
  payment_number
FROM payment_schedules
WHERE id = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';

-- Fix: Set to 'paid' since this was only partially refunded ($200 out of $540.83)
UPDATE payment_schedules
SET
  status = 'paid',
  updated_at = NOW()
WHERE id = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';

-- Verify fix
SELECT
  id,
  status,
  amount,
  payment_number
FROM payment_schedules
WHERE id = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6';

SELECT 'Schedule status fixed! Should now show as partially_refunded in UI.' AS result;
