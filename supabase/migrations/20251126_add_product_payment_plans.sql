-- =====================================================
-- Add Payment Plan Selection to Products
-- =====================================================
-- This migration adds support for products to reference
-- multiple payment plans, giving users choice at checkout
-- =====================================================

-- Add new columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS default_payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS alternative_payment_plan_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allow_plan_selection BOOLEAN DEFAULT true;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_default_payment_plan
ON products(default_payment_plan_id)
WHERE default_payment_plan_id IS NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN products.default_payment_plan_id IS 'Default/recommended payment plan for this product';
COMMENT ON COLUMN products.alternative_payment_plan_ids IS 'Array of alternative payment plan IDs that users can choose from';
COMMENT ON COLUMN products.allow_plan_selection IS 'Whether users can choose between payment plans at checkout';
