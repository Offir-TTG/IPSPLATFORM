-- Add missing publish/unpublish translations for tooltips
DO $$
DECLARE
  v_tenant_id uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN ('lms.builder.publish', 'lms.builder.unpublish', 'lms.builder.unpublished');

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- English
  (v_tenant_id, 'en', 'lms.builder.publish', 'Publish', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.builder.unpublish', 'Unpublish', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.builder.unpublished', 'Unpublished', 'admin', NOW(), NOW()),
  -- Hebrew
  (v_tenant_id, 'he', 'lms.builder.publish', 'פרסם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.builder.unpublish', 'בטל פרסום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.builder.unpublished', 'לא פורסם', 'admin', NOW(), NOW());

  RAISE NOTICE 'Publish/Unpublish translations added successfully';

END $$;
