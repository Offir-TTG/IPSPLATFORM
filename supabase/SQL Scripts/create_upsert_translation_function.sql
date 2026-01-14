-- Create upsert_translation function for handling translation inserts/updates
-- This function handles the unique constraint on (tenant_id, language_code, translation_key, context)

CREATE OR REPLACE FUNCTION upsert_translation(
  p_language_code TEXT,
  p_translation_key TEXT,
  p_translation_value TEXT,
  p_category TEXT,
  p_context TEXT,
  p_tenant_id UUID
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  language_code TEXT,
  translation_key TEXT,
  translation_value TEXT,
  category TEXT,
  context TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to insert, on conflict update
  RETURN QUERY
  INSERT INTO translations (
    tenant_id,
    language_code,
    translation_key,
    translation_value,
    category,
    context,
    created_at,
    updated_at
  )
  VALUES (
    p_tenant_id,
    p_language_code,
    p_translation_key,
    p_translation_value,
    p_category,
    p_context,
    NOW(),
    NOW()
  )
  ON CONFLICT (tenant_id, language_code, translation_key, COALESCE(context, ''))
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    category = EXCLUDED.category,
    context = EXCLUDED.context,
    updated_at = NOW()
  RETURNING
    translations.id,
    translations.tenant_id,
    translations.language_code,
    translations.translation_key,
    translations.translation_value,
    translations.category,
    translations.context,
    translations.created_at,
    translations.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_translation(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
