-- Fix payments table status constraint to allow partially_refunded
-- This fixes the error: new row for relation "payments" violates check constraint "payments_status_check"

-- Drop the old constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Add new constraint that includes partially_refunded
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));

-- Verify the constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
  AND conname = 'payments_status_check';

-- Show success message
SELECT 'Payments status constraint updated successfully!' AS status;
SELECT 'Allowed values: pending, paid, failed, refunded, partially_refunded' AS allowed_statuses;
