-- Translations for the new "Authorize with Keap" button on the
-- Admin → Integrations → Keap tab. Global seed (tenant_id IS NULL)
-- since admin-chrome translations are tenant-agnostic. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE translation_key IN (
    'admin.integrations.keap.authorize',
    'admin.integrations.keap.authorizeHint',
    'admin.integrations.keap.authorizeDisabled'
  )
  AND tenant_id IS NULL;

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.integrations.keap.authorize',
     'Authorize with Keap', 'admin', NULL, 'admin'),
    ('he', 'admin.integrations.keap.authorize',
     'אישור גישה ל-Keap', 'admin', NULL, 'admin'),

    ('en', 'admin.integrations.keap.authorizeHint',
     'Opens Keap to grant access; tokens are saved automatically when you return.',
     'admin', NULL, 'admin'),
    ('he', 'admin.integrations.keap.authorizeHint',
     'פותח את Keap לאישור גישה; הטוקנים יישמרו אוטומטית בחזרתך.',
     'admin', NULL, 'admin'),

    ('en', 'admin.integrations.keap.authorizeDisabled',
     'Enter Client ID first, then click Save.',
     'admin', NULL, 'admin'),
    ('he', 'admin.integrations.keap.authorizeDisabled',
     'הזן Client ID תחילה, ולחץ שמור.',
     'admin', NULL, 'admin');

  RAISE NOTICE 'Keap "Authorize with Keap" button translations seeded.';
END $$;
