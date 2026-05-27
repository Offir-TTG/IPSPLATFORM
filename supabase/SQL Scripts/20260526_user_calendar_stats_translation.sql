-- New "Total" label on the calendar page's stats card row (added
-- when the calendar page was restructured to match the notifications
-- / attendance pattern). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key = 'user.calendar.stats.total';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.calendar.stats.total', 'Total',     'user', NULL, 'user'),
    ('he', 'user.calendar.stats.total', 'סך הכול',    'user', NULL, 'user');
END $$;
