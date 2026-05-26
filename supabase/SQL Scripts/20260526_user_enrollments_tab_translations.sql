-- Translations for the rewritten Enrollments tab on /admin/users/[id].
-- Tab now uses a Card + Table + platform-standard TabPagination.
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.enrollments.title',
      'admin.users.activity.enrollments.count',
      'admin.users.activity.enrollments.col.product',
      'admin.users.activity.enrollments.col.enrolled',
      'admin.users.activity.enrollments.col.status',
      'admin.users.activity.enrollments.col.amount'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.enrollments.title',         'Enrollments',                                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.enrollments.title',         'הרשמות',                                       'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.enrollments.count',         '{{count}} enrollments',                      'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.enrollments.count',         '{{count}} הרשמות',                             'admin', NULL, 'admin'),

    -- Column headers
    ('en', 'admin.users.activity.enrollments.col.product',   'Product',                                    'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.enrollments.col.product',   'מוצר',                                         'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.enrollments.col.enrolled',  'Enrolled',                                   'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.enrollments.col.enrolled',  'תאריך הרשמה',                                   'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.enrollments.col.status',    'Status',                                     'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.enrollments.col.status',    'סטטוס',                                        'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.enrollments.col.amount',    'Paid / Total',                               'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.enrollments.col.amount',    'שולם / סה״כ',                                   'admin', NULL, 'admin');
END $$;
