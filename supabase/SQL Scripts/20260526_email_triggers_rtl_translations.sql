-- Translations for the trigger cards on /admin/emails/triggers.
-- Action-button tooltips were hardcoded English in the previous
-- version and looked out of place in a Hebrew UI; replacing them
-- with t() keys here. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'emails.triggers.test',
      'emails.triggers.activate',
      'emails.triggers.deactivate'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'emails.triggers.test',       'Test trigger', 'admin', NULL, 'admin'),
    ('he', 'emails.triggers.test',       'בדוק טריגר',     'admin', NULL, 'admin'),
    ('en', 'emails.triggers.activate',   'Activate',     'admin', NULL, 'admin'),
    ('he', 'emails.triggers.activate',   'הפעל',          'admin', NULL, 'admin'),
    ('en', 'emails.triggers.deactivate', 'Deactivate',   'admin', NULL, 'admin'),
    ('he', 'emails.triggers.deactivate', 'השבת',          'admin', NULL, 'admin');
END $$;
