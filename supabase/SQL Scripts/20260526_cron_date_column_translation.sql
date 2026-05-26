-- New "Date" column on the cron-runs table. Shows the absolute
-- started_at timestamp alongside the existing relative "When"
-- column. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key = 'admin.crons.col.date';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.crons.col.date', 'Date',   'admin', NULL, 'admin'),
    ('he', 'admin.crons.col.date', 'תאריך',  'admin', NULL, 'admin');
END $$;
