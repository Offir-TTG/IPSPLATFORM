-- Shared nav strip across the three grading sub-pages
-- (Categories / Grade Items / Gradebook). Previously there was no
-- in-page link between them — admins had to edit the URL by hand to
-- move between sections. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.grading.nav.categories',
      'admin.grading.nav.items',
      'admin.grading.nav.gradebook',
      'admin.grading.nav.aria',
      'admin.grading.items.pointsBadge'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.grading.nav.categories', 'Categories',       'admin', NULL, 'admin'),
    ('he', 'admin.grading.nav.categories', 'קטגוריות',           'admin', NULL, 'admin'),

    ('en', 'admin.grading.nav.items',      'Grade Items',      'admin', NULL, 'admin'),
    ('he', 'admin.grading.nav.items',      'פריטי ציון',          'admin', NULL, 'admin'),

    ('en', 'admin.grading.nav.gradebook',  'Gradebook',        'admin', NULL, 'admin'),
    ('he', 'admin.grading.nav.gradebook',  'יומן ציונים',          'admin', NULL, 'admin'),

    ('en', 'admin.grading.nav.aria',       'Grading sections', 'admin', NULL, 'admin'),
    ('he', 'admin.grading.nav.aria',       'מקטעי דירוג',         'admin', NULL, 'admin'),

    -- Max-points pill on each grade-item row (e.g. "100 pts" / "100 נק׳")
    ('en', 'admin.grading.items.pointsBadge', '{{points}} pts',  'admin', NULL, 'admin'),
    ('he', 'admin.grading.items.pointsBadge', '{{points}} נק׳',   'admin', NULL, 'admin');
END $$;
