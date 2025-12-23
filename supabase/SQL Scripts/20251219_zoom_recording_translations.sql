-- ============================================================================
-- Zoom Recording Player Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for Zoom recording player messages
-- Author: System
-- Date: 2025-12-19

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'user.courses.recordingHostedOnZoom'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Recording hosted on Zoom message
  (v_tenant_id, 'en', 'user.courses.recordingHostedOnZoom', 'This recording is hosted on Zoom. If you cannot view it, please contact support.', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.courses.recordingHostedOnZoom', 'הקלטה זו מתארחת ב-Zoom. אם אינך יכול לצפות בה, אנא פנה לתמיכה.', 'user', NOW(), NOW());

  RAISE NOTICE 'Zoom recording player translations added successfully';

END $$;
