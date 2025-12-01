-- =====================================================
-- Migration: Restructure Products as Pure Billing Layer
-- Date: 2025-11-24
--
-- This migration:
-- 1. Recreates products table with complete payment configuration
-- 2. Removes payment/docusign fields from programs
-- 3. Removes payment fields from courses
-- 4. Products become the single source of truth for all billing
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Backup existing data
-- =====================================================

-- Create temporary backup of existing products (if exists)
CREATE TEMP TABLE products_backup AS
SELECT * FROM products WHERE EXISTS (SELECT 1 FROM products LIMIT 1);

-- Create temporary backup of programs
CREATE TEMP TABLE programs_backup AS
SELECT
  id,
  name,
  price,
  payment_plan,
  installment_count,
  docusign_template_id,
  require_signature,
  crm_tag
FROM programs
WHERE price IS NOT NULL OR docusign_template_id IS NOT NULL;

-- Create temporary backup of courses
CREATE TEMP TABLE courses_backup AS
SELECT
  id,
  title,
  price,
  currency,
  payment_plan,
  installment_count
FROM courses
WHERE price IS NOT NULL;

-- =====================================================
-- STEP 2: Drop old products table and related tables
-- =====================================================

DROP TABLE IF EXISTS product_payment_plans CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- =====================================================
-- STEP 3: Create new products table with complete structure
-- =====================================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Product Type & Content
  type TEXT NOT NULL CHECK (type IN ('program', 'course', 'lecture', 'workshop', 'webinar', 'session', 'session_pack', 'bundle', 'custom')),
  title TEXT NOT NULL,
  description TEXT,

  -- Content References
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  contains_courses UUID[] DEFAULT '{}',  -- For bundles: array of course IDs
  session_count INTEGER,  -- For session_pack: number of sessions included

  -- DocuSign Integration (moved from programs)
  requires_signature BOOLEAN DEFAULT false,
  signature_template_id TEXT,

  -- Payment Model
  payment_model TEXT NOT NULL DEFAULT 'one_time' CHECK (payment_model IN ('one_time', 'deposit_then_plan', 'subscription', 'free')),
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Payment Plan Configuration (flexible JSONB structure)
  payment_plan JSONB DEFAULT '{}'::jsonb,
  /* Example payment_plan structures:

  Deposit + Installments:
  {
    "installments": 12,
    "frequency": "monthly",
    "deposit_type": "percentage",
    "deposit_percentage": 20
  }

  Subscription:
  {
    "subscription_interval": "monthly",
    "trial_days": 7
  }
  */

  -- Status & Metadata
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- =====================================================
  -- CONSTRAINTS
  -- =====================================================

  -- Price must be NULL for free products, and > 0 for paid products
  CONSTRAINT valid_price CHECK (
    (payment_model = 'free' AND price IS NULL) OR
    (payment_model != 'free' AND price IS NOT NULL AND price > 0)
  ),

  -- If signature required, template ID must be provided
  CONSTRAINT valid_signature CHECK (
    (requires_signature = false) OR
    (requires_signature = true AND signature_template_id IS NOT NULL)
  ),

  -- Must reference appropriate content based on type
  CONSTRAINT valid_content_reference CHECK (
    (type = 'program' AND program_id IS NOT NULL) OR
    (type = 'course' AND course_id IS NOT NULL) OR
    (type IN ('lecture', 'workshop', 'webinar', 'session', 'custom')) OR
    (type = 'session_pack' AND session_count IS NOT NULL AND session_count > 0) OR
    (type = 'bundle' AND array_length(contains_courses, 1) > 0)
  ),

  -- Only one product per program/course
  CONSTRAINT unique_program UNIQUE NULLS NOT DISTINCT (program_id),
  CONSTRAINT unique_course UNIQUE NULLS NOT DISTINCT (course_id)
);

-- Indexes for performance
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_program ON products(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX idx_products_course ON products(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_payment_model ON products(payment_model);

-- =====================================================
-- STEP 4: Update programs table
-- =====================================================

-- Add product_id reference column (if not exists)
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Drop payment-related columns from programs
ALTER TABLE programs
  DROP COLUMN IF EXISTS price CASCADE,
  DROP COLUMN IF EXISTS currency CASCADE,
  DROP COLUMN IF EXISTS payment_plan CASCADE,
  DROP COLUMN IF EXISTS installment_count CASCADE,
  DROP COLUMN IF EXISTS docusign_template_id CASCADE,
  DROP COLUMN IF EXISTS require_signature CASCADE,
  DROP COLUMN IF EXISTS crm_tag CASCADE;

-- Create index on product_id
CREATE INDEX IF NOT EXISTS idx_programs_product ON programs(product_id);

-- =====================================================
-- STEP 5: Update courses table
-- =====================================================

-- Add product_id reference column (if not exists)
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Drop payment-related columns from courses
ALTER TABLE courses
  DROP COLUMN IF EXISTS price CASCADE,
  DROP COLUMN IF EXISTS currency CASCADE,
  DROP COLUMN IF EXISTS payment_plan CASCADE,
  DROP COLUMN IF EXISTS installment_count CASCADE;

-- Keep is_standalone - still needed to determine if course can have own product
-- Create index on product_id
CREATE INDEX IF NOT EXISTS idx_courses_product ON courses(product_id);

-- =====================================================
-- STEP 6: Update enrollments table
-- =====================================================

-- Add columns for product reference and payment tracking
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_model TEXT,
  ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS signature_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS signature_status TEXT CHECK (signature_status IN ('pending', 'sent', 'completed', 'declined', 'expired'));

CREATE INDEX IF NOT EXISTS idx_enrollments_product ON enrollments(product_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_signature_status ON enrollments(signature_status) WHERE signature_required = true;

-- =====================================================
-- STEP 7: Create updated_at trigger for products
-- =====================================================

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- =====================================================
-- STEP 8: Add helpful comments
-- =====================================================

COMMENT ON TABLE products IS 'Complete billing configuration for all purchasable items. Programs and courses are pure content, products handle all payment logic.';
COMMENT ON COLUMN products.type IS 'Type of product: program, course, lecture, workshop, webinar, session, session_pack, bundle, or custom';
COMMENT ON COLUMN products.payment_model IS 'one_time: pay all now, deposit_then_plan: deposit + installments, subscription: recurring, free: no payment';
COMMENT ON COLUMN products.payment_plan IS 'JSONB configuration for installments, deposits, subscription intervals, etc.';
COMMENT ON COLUMN products.requires_signature IS 'Whether enrollment requires DocuSign signature';
COMMENT ON COLUMN products.contains_courses IS 'For bundles: array of course IDs included in the bundle';
COMMENT ON COLUMN products.session_count IS 'For session_pack: number of sessions included in the pack';

COMMENT ON COLUMN programs.product_id IS 'Back-reference to the product that makes this program billable';
COMMENT ON COLUMN courses.product_id IS 'Back-reference to the product that makes this standalone course billable';

COMMIT;

-- =====================================================
-- Post-migration notes:
-- =====================================================
--
-- After running this migration, you need to:
-- 1. Run the data migration script to move existing programs/courses to products
-- 2. Update application code to use new product structure
-- 3. Test enrollment flow with new product-based billing
-- =====================================================
