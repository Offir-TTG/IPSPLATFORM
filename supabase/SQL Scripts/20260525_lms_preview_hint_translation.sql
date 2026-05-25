-- Tooltip hint for the Preview button on the course-editor page.
-- The button itself uses the existing `lms.builder.preview` key; this
-- new key powers the title-attribute that appears on hover.
DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key = 'lms.builder.preview_hint';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'lms.builder.preview_hint', 'Open the student view in a new tab',         'admin', NULL, 'admin'),
    ('he', 'lms.builder.preview_hint', 'פתח את תצוגת התלמיד בכרטיסייה חדשה',           'admin', NULL, 'admin');

  RAISE NOTICE 'Preview hint translation seeded.';
END $$;
