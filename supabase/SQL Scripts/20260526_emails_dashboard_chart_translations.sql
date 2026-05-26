-- Translations for the two charts on /admin/emails.
--   Daily area chart: sent vs failed over the last 30 days.
--   Status breakdown bar chart: queue rows grouped by current status.
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'emails.dashboard.sentDaily.title',
      'emails.dashboard.sentDaily.description',
      'emails.dashboard.statusBreakdown.title',
      'emails.dashboard.statusBreakdown.description',
      'emails.dashboard.statusBreakdown.count'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Daily chart
    ('en', 'emails.dashboard.sentDaily.title',
      'Sent vs failed — last 30 days',                                          'admin', NULL, 'admin'),
    ('he', 'emails.dashboard.sentDaily.title',
      'נשלחו לעומת נכשלו — 30 הימים האחרונים',                                     'admin', NULL, 'admin'),

    ('en', 'emails.dashboard.sentDaily.description',
      'Daily count of sent and failed emails.',                                 'admin', NULL, 'admin'),
    ('he', 'emails.dashboard.sentDaily.description',
      'ספירה יומית של אימיילים שנשלחו ושנכשלו.',                                    'admin', NULL, 'admin'),

    -- Status breakdown chart
    ('en', 'emails.dashboard.statusBreakdown.title',
      'Status breakdown — last 30 days',                                        'admin', NULL, 'admin'),
    ('he', 'emails.dashboard.statusBreakdown.title',
      'פילוח לפי סטטוס — 30 הימים האחרונים',                                       'admin', NULL, 'admin'),

    ('en', 'emails.dashboard.statusBreakdown.description',
      'Count of queue rows by current status.',                                 'admin', NULL, 'admin'),
    ('he', 'emails.dashboard.statusBreakdown.description',
      'מספר השורות בתור לפי הסטטוס הנוכחי.',                                       'admin', NULL, 'admin'),

    ('en', 'emails.dashboard.statusBreakdown.count', 'Count',  'admin', NULL, 'admin'),
    ('he', 'emails.dashboard.statusBreakdown.count', 'כמות',    'admin', NULL, 'admin');
END $$;
