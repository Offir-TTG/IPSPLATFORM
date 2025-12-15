-- Add translation for topics badge in lesson display
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant_id (adjust if you have specific tenant logic)
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;

  -- Insert English translation
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, category)
  VALUES (
    v_tenant_id,
    'en',
    'lms.builder.topics',
    'Topics',
    'lms'
  )
  ON CONFLICT (tenant_id, language_code, translation_key) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;

  -- Insert Hebrew translation
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, category)
  VALUES (
    v_tenant_id,
    'he',
    'lms.builder.topics',
    'נושאים',
    'lms'
  )
  ON CONFLICT (tenant_id, language_code, translation_key) DO UPDATE
  SET translation_value = EXCLUDED.translation_value;
END $$;
