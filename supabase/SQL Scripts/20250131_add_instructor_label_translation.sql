-- ============================================================================
-- ADD INSTRUCTOR LABEL TRANSLATION
-- ============================================================================
-- Date: 2025-01-31
-- Purpose: Add translation for instructor label in course pages
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
  WHERE translation_key = 'user.courses.instructor'
  AND language_code IN ('en', 'he');

  -- Insert translation for instructor label
  INSERT INTO public.translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id)
  VALUES
    ('en', 'user.courses.instructor', 'Instructor', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'user.courses.instructor', 'מדריך', 'admin', NOW(), NOW(), tenant_uuid);
END $$;

-- ============================================================================
-- TRANSLATION INSERT COMPLETE
-- ============================================================================
-- Summary:
-- - Added 1 translation pair (English + Hebrew)
-- - Used for displaying instructor information in course pages
-- ============================================================================
