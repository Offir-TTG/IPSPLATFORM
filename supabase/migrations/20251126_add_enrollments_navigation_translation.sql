-- Add enrollments navigation translation
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Insert navigation translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.nav.enrollments', 'Enrollments', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.nav.enrollments', 'רישומים', 'admin', NOW(), NOW(), tenant_uuid)
  ON CONFLICT (translation_key, language_code, tenant_id)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Enrollments navigation translation added successfully';
END$$;
