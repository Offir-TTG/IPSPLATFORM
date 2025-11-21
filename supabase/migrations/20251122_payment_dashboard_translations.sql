-- ============================================================================
-- Payment Dashboard Missing Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for payment dashboard cards
-- Author: System
-- Date: 2025-01-22

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'admin.payments.pendingAmount',
      'admin.payments.pendingAmount.description',
      'admin.payments.pendingAmount.fromPayments'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- English translations
  (v_tenant_id, 'en', 'admin.payments.pendingAmount', 'Pending Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.pendingAmount.description', 'Total amount in pending payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.pendingAmount.fromPayments', 'From {count} scheduled payments', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (v_tenant_id, 'he', 'admin.payments.pendingAmount', 'סכום ממתין', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingAmount.description', 'סכום כולל בתשלומים ממתינים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingAmount.fromPayments', 'מתוך {count} תשלומים מתוזמנים', 'admin', NOW(), NOW());

  RAISE NOTICE 'Payment dashboard translations added successfully';

END $$;
