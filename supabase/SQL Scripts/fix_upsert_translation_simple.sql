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
RETURNS SETOF translations
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
  WHERE translations.tenant_id = p_tenant_id
  RETURNING *;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_translation(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
