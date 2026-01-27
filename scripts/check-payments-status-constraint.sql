-- Check current status constraint on payments table
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'payments'::regclass
  AND conname LIKE '%status%';
