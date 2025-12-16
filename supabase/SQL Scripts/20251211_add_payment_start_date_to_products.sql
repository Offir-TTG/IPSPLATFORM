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
