-- ============================================================================
-- ADD BRIDGE ERROR STATE TRANSLATIONS
-- ============================================================================
-- Date: 2025-01-31
-- Purpose: Add error state translations for bridge access page
-- Languages: English (en) and Hebrew (he)
-- ============================================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant UUID
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing translations if they exist
  DELETE FROM public.translations
  WHERE translation_key IN (
    'bridge.error',
    'bridge.try_again'
  )
  AND language_code IN ('en', 'he');

  -- Insert error state translations
  INSERT INTO public.translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id)
  VALUES
    ('en', 'bridge.error', 'Error', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.error', 'שגיאה', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'bridge.try_again', 'Try Again', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'bridge.try_again', 'נסה שוב', 'user', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Successfully added bridge error translations';
END $$;

-- ============================================================================
-- TRANSLATION INSERT COMPLETE
-- ============================================================================
