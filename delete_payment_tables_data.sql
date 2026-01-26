-- Script to delete all data from payment_schedules and payments tables
-- Handles circular foreign key relationship between the tables

BEGIN;

-- Step 1: Break the circular reference by setting payment_id to NULL in payment_schedules
UPDATE payment_schedules
SET payment_id = NULL
WHERE payment_id IS NOT NULL;

-- Step 2: Delete all records from payments table
DELETE FROM payments;

-- Step 3: Delete all records from payment_schedules table
DELETE FROM payment_schedules;

-- Verify deletion
SELECT
  (SELECT COUNT(*) FROM payments) as payments_count,
  (SELECT COUNT(*) FROM payment_schedules) as payment_schedules_count;

COMMIT;

-- If you want to rollback instead of committing, replace COMMIT with:
-- ROLLBACK;
