-- Migration: Migrate plan_start_date from payment_plan JSONB to payment_start_date column
-- Date: 2025-12-11
-- Purpose: Move existing start date data from JSONB to new column and clean up old field

-- Step 1: Migrate existing plan_start_date from payment_plan JSONB to new column
UPDATE products
SET payment_start_date = (payment_plan->>'plan_start_date')::TIMESTAMPTZ
WHERE payment_plan ? 'plan_start_date'
  AND payment_plan->>'plan_start_date' IS NOT NULL
  AND payment_plan->>'plan_start_date' != ''
  AND payment_start_date IS NULL;  -- Only update if not already set

-- Step 2: Remove plan_start_date from payment_plan JSONB (clean up old data)
UPDATE products
SET payment_plan = payment_plan - 'plan_start_date'
WHERE payment_plan ? 'plan_start_date';

-- Step 3: Verify migration - should return products that had their data migrated
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count
    FROM products
    WHERE payment_start_date IS NOT NULL;

    RAISE NOTICE 'Migration complete: % products have payment_start_date set', migrated_count;
END $$;

-- Optional: View migrated products for verification
-- SELECT
--   id,
--   title,
--   payment_model,
--   payment_start_date,
--   payment_plan
-- FROM products
-- WHERE payment_start_date IS NOT NULL
-- ORDER BY created_at DESC;
