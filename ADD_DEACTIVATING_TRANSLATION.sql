-- Add missing "deactivating" translation for deactivate account dialog
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Delete existing translation to avoid duplicates
  DELETE FROM translations WHERE translation_key = 'user.profile.security.deactivating';

  -- Insert English and Hebrew translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    ('en', 'user.profile.security.deactivating', 'Deactivating...', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.security.deactivating', 'משבית...', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Deactivating translation added successfully';
END$$;
