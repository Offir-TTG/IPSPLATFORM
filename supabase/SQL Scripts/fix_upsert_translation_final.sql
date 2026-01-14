-- Drop the existing function first (if it exists)
DROP FUNCTION IF EXISTS upsert_translation(TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

-- Create upsert_translation function for handling translation inserts/updates
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
DECLARE
  v_result RECORD;
BEGIN
  -- Try to insert, on conflict update
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
  ON CONFLICT (translations.tenant_id, translations.language_code, translations.translation_key, COALESCE(translations.context, ''))
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    category = EXCLUDED.category,
    context = EXCLUDED.context,
    updated_at = NOW()
  RETURNING *
  INTO v_result;

  -- Return the result
  RETURN QUERY
  SELECT
    v_result.id,
    v_result.tenant_id,
    v_result.language_code,
    v_result.translation_key,
    v_result.translation_value,
    v_result.category,
    v_result.context,
    v_result.created_at,
    v_result.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_translation(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
