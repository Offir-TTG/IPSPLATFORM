-- Translations for the "Delete old runs" dialog on /admin/crons.
-- Lets admins manually purge `cron_runs` rows older than an anchor
-- date minus N days, without redeploying. Global tenant (tenant_id
-- IS NULL). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.crons.purge.title',
      'admin.crons.purge.description',
      'admin.crons.purge.anchorLabel',
      'admin.crons.purge.daysLabel',
      'admin.crons.purge.daysHint',
      'admin.crons.purge.cutoffLabel',
      'admin.crons.purge.windowLabel',
      'admin.crons.purge.confirm',
      'admin.crons.purge.done',
      'admin.crons.purge.failed',
      'admin.crons.purge.invalidInput'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.crons.purge.title',         'Delete old runs',                              'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.title',         'מחיקת ריצות ישנות',                              'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.description',
      'Delete cron_runs rows older than the cutoff. This cannot be undone.',                  'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.description',
      'מחיקת שורות מטבלת cron_runs ישנות יותר מהתאריך שלהלן. פעולה זו אינה הפיכה.',              'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.anchorLabel',   'Anchor date',                                  'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.anchorLabel',   'תאריך עוגן',                                     'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.daysLabel',     'Days back',                                    'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.daysLabel',     'מספר ימים אחורה',                                'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.daysHint',
      'Everything older than this many days before the anchor date will be deleted.',         'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.daysHint',
      'כל מה שמלפני מספר הימים הזה לפני תאריך העוגן יימחק.',                                     'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.cutoffLabel',   'Will delete runs before',                      'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.cutoffLabel',   'יימחקו ריצות מלפני',                              'admin', NULL, 'admin'),

    -- Replaces cutoffLabel: the dialog now shows a window (from → to)
    -- instead of a single cutoff, because the delete is a date range.
    ('en', 'admin.crons.purge.windowLabel',   'Will delete runs in this window',              'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.windowLabel',   'יימחקו ריצות בטווח הבא',                          'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.confirm',       'Delete',                                       'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.confirm',       'מחק',                                            'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.done',          'Deleted {{count}} run rows.',                  'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.done',          'נמחקו {{count}} שורות ריצה.',                    'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.failed',        'Failed to delete runs',                        'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.failed',        'מחיקת הריצות נכשלה',                              'admin', NULL, 'admin'),

    ('en', 'admin.crons.purge.invalidInput',  'Pick a date and a positive number of days.',   'admin', NULL, 'admin'),
    ('he', 'admin.crons.purge.invalidInput',  'בחר תאריך ומספר ימים חיובי.',                     'admin', NULL, 'admin');
END $$;
