-- Translations for the new "User portal URL" field on
-- /admin/emails/settings. Lets admins point email links at the
-- right domain without redeploying. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'emails.settings.branding.portal_url',
      'emails.settings.branding.portal_url_hint'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'emails.settings.branding.portal_url',      'User portal URL',                                              'admin', NULL, 'admin'),
    ('he', 'emails.settings.branding.portal_url',      'כתובת פורטל המשתמשים',                                             'admin', NULL, 'admin'),

    ('en', 'emails.settings.branding.portal_url_hint',
      'Absolute URL of your user portal. Used to build email button links (e.g. "Watch recording"). Leave empty to inherit from the deployment env.', 'admin', NULL, 'admin'),
    ('he', 'emails.settings.branding.portal_url_hint',
      'כתובת מלאה של פורטל המשתמשים. משמשת לבניית קישורי כפתורים באימיילים (לדוגמה "צפה בהקלטה"). השאר ריק כדי לרשת מהגדרות הדפלוי.', 'admin', NULL, 'admin');
END $$;
