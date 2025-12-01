-- ============================================================================
-- Academic Hours Translation
-- ============================================================================
-- Description: Add English and Hebrew translations for academic hours in course overview
-- Author: System
-- Date: 2025-11-24

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translation if it exists to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key = 'lms.builder.academic_hours';

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  (v_tenant_id, 'en', 'lms.builder.academic_hours', 'Academic Hours', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.builder.academic_hours', 'שעות אקדמיות', 'admin', NOW(), NOW());

  RAISE NOTICE 'Academic hours translation added successfully';

END $$;
