-- New "Total" label on the attendance page's stats card row (added
-- when the attendance page was restructured to match the notifications
-- page layout). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key = 'user.attendance.stats.total';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.attendance.stats.total', 'Total',     'user', NULL, 'user'),
    ('he', 'user.attendance.stats.total', 'סך הכול',    'user', NULL, 'user');
END $$;
