-- Translations for the new "Type" filter dropdown on
-- /admin/payments/schedules + the `manual` payment-type label that
-- appears on synthetic schedule rows mirrored from off-schedule
-- payments. Idempotent — DELETE then INSERT.
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  DELETE FROM translations
   WHERE tenant_id = tenant_uuid
     AND translation_key IN (
       'admin.payments.schedules.type',
       'admin.payments.schedules.typeAll',
       'admin.payments.schedules.paymentType.deposit',
       'admin.payments.schedules.paymentType.installment',
       'admin.payments.schedules.paymentType.subscription',
       'admin.payments.schedules.paymentType.full',
       'admin.payments.schedules.paymentType.manual'
     );

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Filter label + "All" option
    ('en', 'admin.payments.schedules.type',                       'Type',         'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.type',                       'סוג',          'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.typeAll',                    'All Types',    'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.typeAll',                    'כל הסוגים',    'admin', NOW(), NOW(), tenant_uuid),

    -- Per-type labels (used both in the filter dropdown AND in the
    -- table row's Type column via the existing
    -- t(`admin.payments.schedules.paymentType.${type}`) lookup).
    ('en', 'admin.payments.schedules.paymentType.deposit',        'Deposit',      'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paymentType.deposit',        'מקדמה',        'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.paymentType.installment',    'Installment',  'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paymentType.installment',    'תשלום',        'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.paymentType.subscription',   'Subscription', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paymentType.subscription',   'מנוי',         'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.paymentType.full',           'Full',         'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paymentType.full',           'מלא',          'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.paymentType.manual',         'Manual',       'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paymentType.manual',         'ידני',         'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Schedules type filter translations added successfully';
END$$;
