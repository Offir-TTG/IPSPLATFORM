-- ============================================================================
-- EN + HE for the save/clear-cache notifications on /admin/config/settings
-- Idempotent via WHERE NOT EXISTS — safe to re-run.
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
SELECT
  vals.key,
  vals.category,
  vals.description,
  vals.context,
  (SELECT tenant_id FROM public.translation_keys WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('admin.settings.saveSuccess',       'admin', 'Success toast: settings saved',                     'admin'),
  ('admin.settings.saveError',         'admin', 'Error toast: failed to save settings',              'admin'),
  ('admin.settings.cacheCleared',      'admin', 'Success toast: translation cache cleared',          'admin'),
  ('admin.settings.cacheClearError',   'admin', 'Error toast: failed to clear translation cache',    'admin')
) AS vals(key, category, description, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translation_keys tk WHERE tk.key = vals.key
);

-- Hebrew
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('he', 'admin.settings.saveSuccess',     'ההגדרות נשמרו בהצלחה',                                      'admin', 'admin'),
  ('he', 'admin.settings.saveError',       'שמירת ההגדרות נכשלה',                                       'admin', 'admin'),
  ('he', 'admin.settings.cacheCleared',    'מטמון התרגומים נוקה בהצלחה. הדף ייטען מחדש…',              'admin', 'admin'),
  ('he', 'admin.settings.cacheClearError', 'ניקוי מטמון התרגומים נכשל',                                 'admin', 'admin')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);

-- English
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('en', 'admin.settings.saveSuccess',     'Settings saved successfully',                                'admin', 'admin'),
  ('en', 'admin.settings.saveError',       'Failed to save settings',                                    'admin', 'admin'),
  ('en', 'admin.settings.cacheCleared',    'Translation cache cleared successfully. Page will reload…', 'admin', 'admin'),
  ('en', 'admin.settings.cacheClearError', 'Failed to clear translation cache',                          'admin', 'admin')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);
