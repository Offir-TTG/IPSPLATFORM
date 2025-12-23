-- ============================================================================
-- Course Study Time Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for course study time (hours and academic hours)
-- Author: System
-- Date: 2025-12-18

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'user.courses.statistics.hours',
      'user.courses.statistics.academicHours'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Hours translation
  (v_tenant_id, 'en', 'user.courses.statistics.hours', 'h', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.courses.statistics.hours', 'ש', 'user', NOW(), NOW()),

  -- Academic hours translation
  (v_tenant_id, 'en', 'user.courses.statistics.academicHours', 'academic hrs', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.courses.statistics.academicHours', 'שעות אקדמיות', 'user', NOW(), NOW());

  RAISE NOTICE 'Course study time translations added successfully';

END $$;
