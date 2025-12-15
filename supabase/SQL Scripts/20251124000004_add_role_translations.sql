-- =====================================================
-- Add Missing Role Translations
-- =====================================================
-- Adds instructor and admin role translations
-- Total: 2 keys × 2 languages = 4 rows
-- =====================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant UUID
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Insert role translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- English
    ('en', 'user.profile.role.instructor', 'Instructor', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.role.admin', 'Admin', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.role.instructor', 'מדריך', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.role.admin', 'מנהל', 'user', NOW(), NOW(), tenant_uuid)
  ON CONFLICT (tenant_id, language_code, translation_key)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Successfully added 2 role translation keys (4 total rows): instructor, admin';

END $$;
