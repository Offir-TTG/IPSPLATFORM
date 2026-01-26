-- Migration: Populate payment_start_date for existing enrollments
-- Date: 2026-01-19
-- Purpose: Copy payment_start_date from products to enrollments that don't have it set

-- Update enrollments to inherit payment_start_date from their product
-- Only update enrollments where payment_start_date is NULL
UPDATE enrollments e
SET payment_start_date = p.payment_start_date,
    updated_at = NOW()
FROM products p
WHERE e.product_id = p.id
  AND e.payment_start_date IS NULL  -- Only update if not already set
  AND p.payment_start_date IS NOT NULL  -- Only if product has a start date
  AND e.status IN ('active', 'pending', 'draft');  -- Only active/pending enrollments

-- Verification: Count how many enrollments were updated
DO $$
DECLARE
    updated_count INTEGER;
    total_with_date INTEGER;
BEGIN
    -- Get count of enrollments that now have payment_start_date
    SELECT COUNT(*) INTO total_with_date
    FROM enrollments
    WHERE payment_start_date IS NOT NULL;

    RAISE NOTICE 'Migration complete: % enrollments now have payment_start_date set', total_with_date;
END $$;

-- Optional: View updated enrollments for verification
-- SELECT
--   e.id,
--   e.status,
--   e.payment_start_date,
--   p.title as product_title,
--   p.payment_start_date as product_payment_start_date
-- FROM enrollments e
-- JOIN products p ON e.product_id = p.id
-- WHERE e.payment_start_date IS NOT NULL
-- ORDER BY e.created_at DESC
-- LIMIT 20;
