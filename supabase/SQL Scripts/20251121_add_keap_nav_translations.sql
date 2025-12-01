-- Add Keap navigation menu translations
-- This migration adds translations for the Keap section in the admin sidebar navigation

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN
  -- Delete existing translations if they exist
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'admin.nav.keap',
      'admin.nav.keap.dashboard',
      'admin.nav.keap.tags'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- English translations
  (v_tenant_id, 'en', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.nav.keap.dashboard', 'Keap Dashboard', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.nav.keap.tags', 'Tags', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (v_tenant_id, 'he', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.keap.dashboard', 'לוח בקרה Keap', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.keap.tags', 'תגיות', 'admin', NOW(), NOW());

END $$;
