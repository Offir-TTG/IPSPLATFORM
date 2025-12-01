-- Check if common.cancel translation exists
SELECT
  translation_key,
  language_code,
  translation_value,
  category,
  tenant_id
FROM translations
WHERE translation_key = 'common.cancel'
ORDER BY language_code;

-- If no results, run this to add it:
/*
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Delete existing to avoid duplicates
  DELETE FROM translations WHERE translation_key = 'common.cancel';

  -- Insert English & Hebrew
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    ('en', 'common.cancel', 'Cancel', 'common', NOW(), NOW(), tenant_uuid),
    ('he', 'common.cancel', 'ביטול', 'common', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'common.cancel translation added';
END$$;
*/
