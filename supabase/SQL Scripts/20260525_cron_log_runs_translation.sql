-- Translations for the new per-cron "Store run history" toggle on
-- /admin/crons. Lets the admin opt chatty crons out of cron_runs
-- inserts so the table stays bounded. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.crons.toggle.logRuns',
      'admin.crons.runs',
      'admin.crons.runsHint'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.crons.toggle.logRuns', 'Store run history', 'admin', NULL, 'admin'),
    ('he', 'admin.crons.toggle.logRuns', 'שמור היסטוריית ריצות', 'admin', NULL, 'admin'),

    -- Card header for the redesigned runs table.
    ('en', 'admin.crons.runs',         'Runs',                                                  'admin', NULL, 'admin'),
    ('he', 'admin.crons.runs',         'ריצות',                                                  'admin', NULL, 'admin'),
    ('en', 'admin.crons.runsHint',     'Showing {{n}} of {{total}}. Tap a row to see the full summary.', 'admin', NULL, 'admin'),
    ('he', 'admin.crons.runsHint',     'מציג {{n}} מתוך {{total}}. הקש על שורה לפרטים מלאים.',         'admin', NULL, 'admin');
END $$;
