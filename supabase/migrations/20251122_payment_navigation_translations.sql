-- ============================================================================
-- Payment Navigation & Back Button Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for payment navigation and back buttons
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
      'common.back',
      'admin.nav.payments.dashboard',
      'admin.nav.payments.plans',
      'admin.nav.payments.schedules',
      'admin.nav.payments.transactions',
      'admin.nav.payments.disputes',
      'admin.nav.enrollments',
      'admin.payments.cards.paymentPlans.title',
      'admin.payments.cards.paymentPlans.description',
      'admin.payments.cards.schedules.title',
      'admin.payments.cards.schedules.description',
      'admin.payments.cards.transactions.title',
      'admin.payments.cards.transactions.description',
      'admin.payments.cards.disputes.title',
      'admin.payments.cards.disputes.description',
      'admin.payments.cards.enrollments.title',
      'admin.payments.cards.enrollments.description',
      'admin.payments.cards.reports.title',
      'admin.payments.cards.reports.description'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Common translations
  (v_tenant_id, 'en', 'common.back', 'Back', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.back', 'חזרה', 'admin', NOW(), NOW()),

  -- Navigation translations
  (v_tenant_id, 'en', 'admin.nav.payments.dashboard', 'Payments Overview', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.payments.dashboard', 'סקירת תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.nav.payments.plans', 'Payment Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.payments.plans', 'תוכניות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.nav.payments.schedules', 'Schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.payments.schedules', 'לוחות זמנים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.nav.payments.transactions', 'Transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.payments.transactions', 'עסקאות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.nav.payments.disputes', 'Disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.payments.disputes', 'מחלוקות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.nav.enrollments', 'Enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.nav.enrollments', 'הרשמות', 'admin', NOW(), NOW()),

  -- Dashboard card translations - Payment Plans
  (v_tenant_id, 'en', 'admin.payments.cards.paymentPlans.title', 'Payment Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.title', 'תוכניות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.paymentPlans.description', 'Configure and manage payment plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.description', 'הגדרה וניהול תוכניות תשלום', 'admin', NOW(), NOW()),

  -- Dashboard card translations - Schedules
  (v_tenant_id, 'en', 'admin.payments.cards.schedules.title', 'Schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.title', 'לוחות זמנים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.schedules.description', 'View and manage payment schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.description', 'צפייה וניהול לוחות זמני תשלומים', 'admin', NOW(), NOW()),

  -- Dashboard card translations - Transactions
  (v_tenant_id, 'en', 'admin.payments.cards.transactions.title', 'Transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.title', 'עסקאות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.transactions.description', 'View transaction history and refunds', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.description', 'צפייה בהיסטוריית עסקאות והחזרים', 'admin', NOW(), NOW()),

  -- Dashboard card translations - Disputes
  (v_tenant_id, 'en', 'admin.payments.cards.disputes.title', 'Disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.disputes.title', 'מחלוקות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.disputes.description', 'Handle payment disputes and chargebacks', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.disputes.description', 'טיפול במחלוקות תשלום וחיובים חוזרים', 'admin', NOW(), NOW()),

  -- Dashboard card translations - Enrollments
  (v_tenant_id, 'en', 'admin.payments.cards.enrollments.title', 'Enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.enrollments.title', 'הרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.enrollments.description', 'Manage user enrollments and payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.enrollments.description', 'ניהול הרשמות משתמשים ותשלומים', 'admin', NOW(), NOW()),

  -- Dashboard card translations - Reports
  (v_tenant_id, 'en', 'admin.payments.cards.reports.title', 'Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.title', 'דוחות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.reports.description', 'View payment reports and analytics', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.description', 'צפייה בדוחות תשלומים וניתוחים', 'admin', NOW(), NOW());

  RAISE NOTICE 'Payment navigation translations added successfully';

END $$;
