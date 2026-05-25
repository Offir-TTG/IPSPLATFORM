-- Translations for the off-schedule (standalone) payment dialog on
-- /admin/payments/schedules. The shared keys (recordManualMethod*,
-- recordManualRef*, recordManualNotes*, recordManualSubmit*) live in
-- 20260524_record_manual_payment_translations.sql — only Phase-B-only
-- strings live here. Column is `context` (not `category`).
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
     AND (
       translation_key LIKE 'admin.payments.schedules.recordStandalone%'
       OR translation_key IN ('common.searching', 'common.loading')
     );

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Top button + dialog header
    ('en', 'admin.payments.schedules.recordStandalone',                  'Record off-schedule payment',                              'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandalone',                  'רשום תשלום חיצוני למסלול',                                   'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneTitle',             'Record off-schedule payment',                              'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneTitle',             'רישום תשלום חיצוני למסלול',                                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneDescription',       'Log a payment that did not flow through Stripe and is not tied to a scheduled installment. Optionally link it to a specific enrollment so its paid balance updates.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneDescription',       'תיעוד תשלום שלא עבר ב-Stripe ולא קשור לתשלום מתוזמן. ניתן לקשר להרשמה ספציפית כדי שיתרת התשלום שלה תתעדכן.', 'admin', NOW(), NOW(), tenant_uuid),

    -- Customer picker
    ('en', 'admin.payments.schedules.recordStandaloneCustomer',          'Customer',                                                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneCustomer',          'לקוח',                                                      'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneCustomerPlaceholder','Search by email (min 3 chars)…',                          'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneCustomerPlaceholder','חיפוש לפי דוא״ל (מינימום 3 תווים)…',                        'admin', NOW(), NOW(), tenant_uuid),

    -- Enrollment picker
    ('en', 'admin.payments.schedules.recordStandaloneEnrollment',        'Apply to enrollment (optional)',                           'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneEnrollment',        'שייך להרשמה (אופציונלי)',                                    'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneNoEnrollment',      'No enrollment (contact-level payment)',                    'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneNoEnrollment',      'ללא הרשמה (תשלום ברמת איש קשר)',                              'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneNoEnrollments',     'This customer has no enrollments yet.',                    'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneNoEnrollments',     'ללקוח זה אין הרשמות עדיין.',                                  'admin', NOW(), NOW(), tenant_uuid),

    -- Amount / currency
    ('en', 'admin.payments.schedules.recordStandaloneAmount',            'Amount',                                                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneAmount',            'סכום',                                                      'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneCurrency',          'Currency',                                                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneCurrency',          'מטבע',                                                      'admin', NOW(), NOW(), tenant_uuid),

    -- Outcome + error toasts
    ('en', 'admin.payments.schedules.recordStandaloneSuccess',           'Off-schedule payment recorded.',                           'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneSuccess',           'תשלום חיצוני למסלול נרשם בהצלחה.',                            'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneError',             'Failed to record payment',                                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneError',             'רישום התשלום נכשל',                                          'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordStandaloneAmountError',       'Amount must be greater than zero.',                        'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordStandaloneAmountError',       'הסכום חייב להיות גדול מאפס.',                                'admin', NOW(), NOW(), tenant_uuid),

    -- Tiny common helpers used by the dialog
    ('en', 'common.searching',                                            'Searching…',                                              'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'common.searching',                                            'מחפש…',                                                    'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'common.loading',                                              'Loading…',                                                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'common.loading',                                              'טוען…',                                                    'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Standalone payment recording translations added successfully';
END$$;
