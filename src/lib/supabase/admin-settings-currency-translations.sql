-- ============================================================================
-- Hebrew + English coverage for the platform_settings currency rows
-- rendered on /admin/config/settings (the Business category).
--
-- Why this file exists: the labels/descriptions for "Default Currency",
-- "Currency Display", "Supported Currencies" live as DB columns on
-- platform_settings (label, description). The settings page used to
-- render those raw English values. After the page edit, each row's
-- label/description is now looked up via
--   admin.settings.${setting_key}.label
--   admin.settings.${setting_key}.description
-- with the raw DB string as the fallback. This SQL provides the
-- Hebrew (and refreshes English) values for the three currency rows.
--
-- Idempotent via WHERE NOT EXISTS — safe to re-run.
-- ============================================================================

-- ── Register the keys ──────────────────────────────────────────────────────
INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
SELECT
  vals.key,
  vals.category,
  vals.description,
  vals.context,
  (SELECT tenant_id FROM public.translation_keys WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('admin.settings.platform.currency.default.label',         'admin', 'Settings row: Default Currency — label',         'admin'),
  ('admin.settings.platform.currency.default.description',   'admin', 'Settings row: Default Currency — description',   'admin'),
  ('admin.settings.platform.currency.display.label',         'admin', 'Settings row: Currency Display — label',         'admin'),
  ('admin.settings.platform.currency.display.description',   'admin', 'Settings row: Currency Display — description',   'admin'),
  ('admin.settings.platform.currency.supported.label',       'admin', 'Settings row: Supported Currencies — label',     'admin'),
  ('admin.settings.platform.currency.supported.description', 'admin', 'Settings row: Supported Currencies — description','admin')
) AS vals(key, category, description, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translation_keys tk WHERE tk.key = vals.key
);

-- ── Hebrew translations ────────────────────────────────────────────────────
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('he', 'admin.settings.platform.currency.default.label',         'מטבע ברירת מחדל',                                'admin', 'admin'),
  ('he', 'admin.settings.platform.currency.default.description',   'קוד המטבע הראשי של הפלטפורמה',                   'admin', 'admin'),
  ('he', 'admin.settings.platform.currency.display.label',         'תצוגת מטבע',                                     'admin', 'admin'),
  ('he', 'admin.settings.platform.currency.display.description',   'הצגת סמל או קוד',                                'admin', 'admin'),
  ('he', 'admin.settings.platform.currency.supported.label',       'מטבעות נתמכים',                                  'admin', 'admin'),
  ('he', 'admin.settings.platform.currency.supported.description', 'רשימת המטבעות שמשתמשים יכולים לבחור מתוכם',     'admin', 'admin')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);

-- ── English translations ───────────────────────────────────────────────────
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('en', 'admin.settings.platform.currency.default.label',         'Default Currency',                                  'admin', 'admin'),
  ('en', 'admin.settings.platform.currency.default.description',   'Platform default currency code',                    'admin', 'admin'),
  ('en', 'admin.settings.platform.currency.display.label',         'Currency Display',                                  'admin', 'admin'),
  ('en', 'admin.settings.platform.currency.display.description',   'Show symbol or code',                               'admin', 'admin'),
  ('en', 'admin.settings.platform.currency.supported.label',       'Supported Currencies',                              'admin', 'admin'),
  ('en', 'admin.settings.platform.currency.supported.description', 'List of currencies users can choose from',          'admin', 'admin')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);
