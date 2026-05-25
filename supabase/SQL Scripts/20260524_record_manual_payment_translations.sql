-- Translations for the per-row "Record manual payment" action on
-- /admin/payments/schedules. Hebrew is first-pass natural phrasing.
-- Reminder: the translations column is `context` (not `category`); the
-- API filters by context IN ('admin','both').
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
     AND translation_key LIKE 'admin.payments.schedules.recordManual%';

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Menu action label
    ('en', 'admin.payments.schedules.recordManual',                  'Record manual payment',                                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManual',                  'רשום תשלום ידני',                                          'admin', NOW(), NOW(), tenant_uuid),

    -- Dialog header
    ('en', 'admin.payments.schedules.recordManualTitle',             'Record manual payment',                                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualTitle',             'רישום תשלום ידני',                                         'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualDescription',       'Mark this scheduled payment as received via an offline method (ACH, wire, cash, check). The schedule will be set to paid and the enrollment balance updated.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualDescription',       'סמן את תשלום המסלול כהתקבל באמצעי תשלום חיצוני (העברה בנקאית, מזומן, צ׳ק). המסלול יסומן כשולם ויתרת ההרשמה תתעדכן.', 'admin', NOW(), NOW(), tenant_uuid),

    -- Read-only summary lines
    ('en', 'admin.payments.schedules.recordManualAmount',            'Amount',                                                  'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualAmount',            'סכום',                                                     'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualCustomer',          'Customer',                                                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualCustomer',          'לקוח',                                                     'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualProduct',           'Product',                                                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualProduct',           'מוצר',                                                     'admin', NOW(), NOW(), tenant_uuid),

    -- Form fields
    ('en', 'admin.payments.schedules.recordManualMethod',            'Payment method',                                          'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualMethod',            'אמצעי תשלום',                                              'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualMethodBank',        'Bank transfer / ACH',                                     'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualMethodBank',        'העברה בנקאית / ACH',                                       'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualMethodCash',        'Cash',                                                    'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualMethodCash',        'מזומן',                                                    'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualMethodCheck',       'Check',                                                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualMethodCheck',       'צ׳ק',                                                      'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualMethodOther',       'Other',                                                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualMethodOther',       'אחר',                                                      'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.schedules.recordManualRef',               'Reference (transaction / check #)',                       'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualRef',               'מזהה (מספר עסקה / צ׳ק)',                                   'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualRefPlaceholder',    'e.g. WIRE-2026-04-12-89321',                              'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualRefPlaceholder',    'למשל: WIRE-2026-04-12-89321',                              'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.schedules.recordManualNotes',             'Notes (optional)',                                        'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualNotes',             'הערות (אופציונלי)',                                        'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualNotesPlaceholder',  'Internal context for this payment',                       'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualNotesPlaceholder',  'הקשר פנימי לתשלום זה',                                     'admin', NOW(), NOW(), tenant_uuid),

    -- Submit / states
    ('en', 'admin.payments.schedules.recordManualSubmit',            'Record payment',                                          'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualSubmit',            'רשום תשלום',                                               'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualSubmitting',        'Recording…',                                              'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualSubmitting',        'רושם…',                                                    'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualSuccess',           'Manual payment recorded; schedule marked as paid.',       'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualSuccess',           'תשלום ידני נרשם בהצלחה; המסלול סומן כשולם.',                'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordManualError',             'Failed to record manual payment',                         'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordManualError',             'רישום תשלום ידני נכשל',                                    'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Manual payment recording translations added successfully';
END$$;
