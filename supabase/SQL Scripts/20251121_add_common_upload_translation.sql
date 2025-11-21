-- Add missing common.upload translation for materials upload dialog
DO $$
DECLARE
  v_tenant_id uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translation if it exists
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key = 'common.upload';

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  (v_tenant_id, 'en', 'common.upload', 'Upload', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.upload', 'העלה', 'admin', NOW(), NOW());

END $$;
