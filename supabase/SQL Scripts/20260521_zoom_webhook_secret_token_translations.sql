-- Translations for the new "Webhook Secret Token" field on the Zoom
-- integration admin tab. Global (tenant_id IS NULL) — admin chrome
-- convention. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE translation_key IN (
    'admin.integrations.zoom.webhookSecretToken',
    'admin.integrations.zoom.webhookSecretTokenPlaceholder'
  )
  AND tenant_id IS NULL;

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.integrations.zoom.webhookSecretToken',
     'Webhook Secret Token',
     'admin', NULL, 'admin'),
    ('he', 'admin.integrations.zoom.webhookSecretToken',
     'טוקן סודי של Webhook',
     'admin', NULL, 'admin'),

    ('en', 'admin.integrations.zoom.webhookSecretTokenPlaceholder',
     'Copy from Zoom → Event Subscriptions',
     'admin', NULL, 'admin'),
    ('he', 'admin.integrations.zoom.webhookSecretTokenPlaceholder',
     'העתק מ-Zoom ← מינויי אירועים',
     'admin', NULL, 'admin');

  RAISE NOTICE 'Zoom webhook secret token translations seeded.';
END $$;
