-- Check what constraint currently exists on payments table
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
  AND contype = 'c'  -- Check constraints only
ORDER BY conname;
