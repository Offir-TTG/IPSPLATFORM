-- Add translation for remove avatar button
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Delete existing translations if they exist
  DELETE FROM translations WHERE translation_key IN (
    'user.profile.upload.remove_avatar',
    'user.profile.upload.avatar_removed_success'
  );

  -- Insert English and Hebrew translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    -- Remove Avatar Button
    ('en', 'user.profile.upload.remove_avatar', 'Remove Avatar', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.upload.remove_avatar', 'הסר תמונה', 'user', NOW(), NOW(), tenant_uuid),

    -- Success Messages
    ('en', 'user.profile.upload.avatar_removed_success', 'Avatar removed successfully', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.upload.avatar_removed_success', 'התמונה הוסרה בהצלחה', 'user', NOW(), NOW(), tenant_uuid),

    ('en', 'user.profile.upload.avatar_updated_success', 'Avatar updated successfully', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.upload.avatar_updated_success', 'התמונה עודכנה בהצלחה', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Remove avatar translations added successfully';
END$$;
