-- ============================================================================
-- Add Cancelled Payment Status Translation
-- ============================================================================
-- Description: Add translation for cancelled payment status
-- Author: Claude Code Assistant
-- Date: 2025-12-02

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
