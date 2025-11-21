-- ============================================================================
-- APPLY MISSING MATERIALS TRANSLATIONS
-- Run this in Supabase SQL Editor if migrations haven't been applied
-- ============================================================================

DO $$
DECLARE
  v_tenant_id uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations first to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN ('common.upload', 'lms.materials.choose_file');

  -- Insert translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
  -- common.upload
  (v_tenant_id, 'en', 'common.upload', 'Upload', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.upload', 'העלה', 'admin', NOW(), NOW()),
  -- lms.materials.choose_file
  (v_tenant_id, 'en', 'lms.materials.choose_file', 'Choose File', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.materials.choose_file', 'בחר קובץ', 'admin', NOW(), NOW());

  RAISE NOTICE 'Translations applied successfully';

END $$;
