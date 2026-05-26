-- Translations for the rewritten Payments tab on /admin/users/[id].
-- Two tables (Upcoming + History) each paginated independently with
-- the platform-standard TabPagination. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.payments.upcomingCount',
      'admin.users.activity.payments.historyCount',
      'admin.users.activity.payments.col.product',
      'admin.users.activity.payments.col.due',
      'admin.users.activity.payments.col.paidAt',
      'admin.users.activity.payments.col.type',
      'admin.users.activity.payments.col.status',
      'admin.users.activity.payments.col.amount',
      'admin.users.activity.payments.refunded'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Count chips per section
    ('en', 'admin.users.activity.payments.upcomingCount', '{{count}} scheduled',           'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.upcomingCount', '{{count}} מתוזמנים',              'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.historyCount',  '{{count}} payments',             'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.historyCount',  '{{count}} תשלומים',                'admin', NULL, 'admin'),

    -- Column headers (shared across both tables)
    ('en', 'admin.users.activity.payments.col.product',   'Product',                        'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.product',   'מוצר',                             'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.col.due',       'Due',                            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.due',       'לתשלום',                            'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.col.paidAt',    'Paid at',                        'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.paidAt',    'שולם בתאריך',                       'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.col.type',      'Type',                           'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.type',      'סוג',                              'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.col.status',    'Status',                         'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.status',    'סטטוס',                            'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.col.amount',    'Amount',                         'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.amount',    'סכום',                             'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.refunded',      'Refunded',                       'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.refunded',      'הוחזר',                            'admin', NULL, 'admin');
END $$;
