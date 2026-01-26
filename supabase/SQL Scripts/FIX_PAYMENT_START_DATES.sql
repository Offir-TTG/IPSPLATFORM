-- Complete Fix: Set payment_start_date for products and enrollments
-- Date: 2026-01-19
-- Purpose: Ensure all products and enrollments have payment_start_date populated

-- ===========================================================================
-- PART 1: Fix Products - Set payment_start_date for products that don't have it
-- ===========================================================================

-- For products with payment_model that need a start date but don't have one
-- Use a reasonable default: first day of next month
UPDATE products
SET payment_start_date = DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
    updated_at = NOW()
WHERE payment_start_date IS NULL
  AND payment_model IN ('deposit_then_plan', 'subscription', 'one_time')
  AND is_active = true;

-- Verify products migration
DO $$
DECLARE
    products_with_date INTEGER;
    products_without_date INTEGER;
BEGIN
    SELECT COUNT(*) INTO products_with_date
    FROM products
    WHERE payment_start_date IS NOT NULL;

    SELECT COUNT(*) INTO products_without_date
    FROM products
    WHERE payment_start_date IS NULL
      AND payment_model IN ('deposit_then_plan', 'subscription', 'one_time')
      AND is_active = true;

    RAISE NOTICE 'Products with payment_start_date: %', products_with_date;
    RAISE NOTICE 'Products still missing payment_start_date: %', products_without_date;
END $$;

-- ===========================================================================
-- PART 2: Fix Enrollments - Copy payment_start_date from products
-- ===========================================================================

-- Update enrollments to inherit payment_start_date from their product
UPDATE enrollments e
SET payment_start_date = p.payment_start_date,
    updated_at = NOW()
FROM products p
WHERE e.product_id = p.id
  AND e.payment_start_date IS NULL  -- Only update if not already set
  AND p.payment_start_date IS NOT NULL  -- Only if product has a start date
  AND e.status IN ('active', 'pending', 'draft');  -- Only active/pending/draft enrollments

-- Verify enrollments migration
DO $$
DECLARE
    enrollments_with_date INTEGER;
    enrollments_without_date INTEGER;
BEGIN
    SELECT COUNT(*) INTO enrollments_with_date
    FROM enrollments
    WHERE payment_start_date IS NOT NULL;

    SELECT COUNT(*) INTO enrollments_without_date
    FROM enrollments
    WHERE payment_start_date IS NULL
      AND status IN ('active', 'pending', 'draft');

    RAISE NOTICE 'Enrollments with payment_start_date: %', enrollments_with_date;
    RAISE NOTICE 'Enrollments still missing payment_start_date: %', enrollments_without_date;
END $$;

-- ===========================================================================
-- PART 3: Verification Query
-- ===========================================================================

-- Show sample of enrollments with their payment_start_date
SELECT
  e.id as enrollment_id,
  e.status as enrollment_status,
  e.payment_start_date as enrollment_payment_start_date,
  p.title as product_title,
  p.payment_model,
  p.payment_start_date as product_payment_start_date,
  CASE
    WHEN e.payment_start_date IS NULL THEN 'MISSING'
    ELSE 'OK'
  END as status_check
FROM enrollments e
JOIN products p ON e.product_id = p.id
WHERE e.status IN ('active', 'pending', 'draft')
ORDER BY
  CASE WHEN e.payment_start_date IS NULL THEN 0 ELSE 1 END,  -- Show missing first
  e.created_at DESC
LIMIT 20;
