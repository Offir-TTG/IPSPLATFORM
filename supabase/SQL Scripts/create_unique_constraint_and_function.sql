-- First, check if the unique constraint exists, and create it if it doesn't
-- The constraint should be on (tenant_id, language_code, translation_key, context)

-- Drop existing constraint if it exists with wrong definition
DO $$
BEGIN
    -- Try to drop the constraint if it exists (ignore error if it doesn't)
    ALTER TABLE translations DROP CONSTRAINT IF EXISTS translations_tenant_lang_key_context_unique;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Create the unique constraint
-- Note: We use COALESCE to handle NULL context values
CREATE UNIQUE INDEX IF NOT EXISTS translations_tenant_lang_key_context_unique
ON translations (tenant_id, language_code, translation_key, COALESCE(context, ''));

-- Now drop and recreate the function with the correct ON CONFLICT clause
DROP FUNCTION IF EXISTS upsert_translation(TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

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
  -- Insert or update using the unique index
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
  RETURNING *;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION upsert_translation(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
