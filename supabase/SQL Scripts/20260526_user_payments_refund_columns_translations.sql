-- New "Refunded" + "Net" columns on Payment History table
-- (/admin/users/[id] -> Payments tab). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.payments.col.refunded',
      'admin.users.activity.payments.col.net',
      'admin.users.activity.payments.net'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.payments.col.refunded', 'Refunded', 'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.refunded', 'הוחזר',     'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.col.net',      'Net',      'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.col.net',      'נטו',      'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.payments.net',          'Net',      'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.payments.net',          'נטו',      'admin', NULL, 'admin');
END $$;
