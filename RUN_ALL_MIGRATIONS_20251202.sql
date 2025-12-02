-- =====================================================
-- CONSOLIDATED MIGRATIONS - December 2, 2025
-- =====================================================
-- Run this entire file in Supabase SQL Editor
-- These migrations fix enrollment wizard and cancellation issues
-- =====================================================

-- =====================================================
-- MIGRATION 1: Add wizard_profile_data column
-- =====================================================
-- Purpose: Store temporary user profile data during unauthenticated enrollment
-- Fixes: Token-based enrollment flow without creating user accounts

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS wizard_profile_data JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_enrollments_wizard_profile_data
ON enrollments USING GIN (wizard_profile_data);

COMMENT ON COLUMN enrollments.wizard_profile_data IS 'Temporary storage for user profile data during unauthenticated enrollment wizard. Data is moved to users table when account is created.';

-- =====================================================
-- MIGRATION 2: Add payment_metadata column
-- =====================================================
-- Purpose: Store payment audit trail and metadata
-- Fixes: "Could not find the 'payment_metadata' column" error

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_enrollments_payment_metadata
ON enrollments USING GIN (payment_metadata);

COMMENT ON COLUMN enrollments.payment_metadata IS 'Metadata about payment processing, cancellations, refunds, and audit trail';

-- =====================================================
-- MIGRATION 3: Add 'cancelled' to payment_status
-- =====================================================
-- Purpose: Allow payment_status='cancelled' for cancelled enrollments
-- Fixes: "violates check constraint enrollments_payment_status_check" error

-- Drop existing constraint
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_payment_status_check;

-- Add new constraint with 'cancelled' option
ALTER TABLE enrollments
ADD CONSTRAINT enrollments_payment_status_check
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled'));

-- Update comment
COMMENT ON COLUMN enrollments.payment_status IS 'Payment status: pending, partial, paid, overdue, or cancelled';

-- =====================================================
-- MIGRATION 4: Add cancelled payment status translation
-- =====================================================
-- Purpose: Add translation for cancelled payment status in enrollment list
-- Fixes: Missing translation for cancelled payment status

DO $$
BEGIN
  -- Add cancelled payment status translation
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  VALUES
    ('admin.enrollments.paymentStatus.cancelled', 'en', 'Cancelled', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.cancelled', 'he', 'מבוטל', 'admin', NULL::uuid)
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Cancelled payment status translation added successfully';
END$$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Uncomment and run these queries after migration to verify

-- SELECT
--   column_name,
--   data_type,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'enrollments'
--   AND column_name IN ('wizard_profile_data', 'payment_metadata')
-- ORDER BY column_name;

-- SELECT
--   conname as constraint_name,
--   pg_get_constraintdef(oid) as constraint_definition
-- FROM pg_constraint
-- WHERE conname = 'enrollments_payment_status_check';
