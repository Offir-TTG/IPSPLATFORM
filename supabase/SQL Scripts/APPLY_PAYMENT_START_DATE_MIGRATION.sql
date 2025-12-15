-- Migration: Add payment_start_date to products table
-- Date: 2025-12-11
-- Purpose: Move payment start date from payment_plan JSONB to top-level column
--          Makes start date available for ALL payment models, not just deposit_then_plan

-- Add payment_start_date column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS payment_start_date TIMESTAMPTZ;

-- Add column comment
COMMENT ON COLUMN products.payment_start_date IS 'Default start date for payment schedules. When first payment is due for new enrollments. Works for all payment models (one_time, deposit_then_plan, subscription, free) and both payment plan template and direct config approaches.';

-- Create index for queries filtering by payment_start_date
CREATE INDEX IF NOT EXISTS idx_products_payment_start_date ON products(payment_start_date)
WHERE payment_start_date IS NOT NULL;
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
-- Migration: Add payment_start_date field translations
-- Date: 2025-12-11
-- Purpose: Add translations for the new payment_start_date field in products

-- Insert translations (skip if already exist)
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
VALUES
  -- English translations
  (NULL::uuid, 'en', 'admin.products.payment_start_date', 'Payment Start Date', 'admin', NOW(), NOW()),
  (NULL::uuid, 'en', 'admin.products.payment_start_date_help', 'Default date when first payment is due for new enrollments. Works for all payment models.', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (NULL::uuid, 'he', 'admin.products.payment_start_date', 'תאריך תחילת תשלום', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.products.payment_start_date_help', 'תאריך ברירת המחדל למועד התשלום הראשון עבור הרשמות חדשות. עובד עבור כל מודלי התשלום.', 'admin', NOW(), NOW())
ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = NOW();

-- Verify translations were added
SELECT translation_key, language_code, translation_value
FROM translations
WHERE translation_key IN ('admin.products.payment_start_date', 'admin.products.payment_start_date_help')
ORDER BY translation_key, language_code;
