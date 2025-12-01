-- ============================================================================
-- ADMIN PAYMENTS PAGE TRANSLATIONS - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- Instructions:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. Refresh your admin payments page
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the tenant_id from the first admin user
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE role IN ('admin', 'super_admin')
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Please create an admin user first.';
  END IF;

  RAISE NOTICE 'Using tenant_id: %', v_tenant_id;

  -- Delete existing admin.payments translations to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key LIKE 'admin.payments%'
    AND context = 'admin';

  RAISE NOTICE 'Deleted existing admin.payments translations';

  -- Insert all English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Main Page Header
  (v_tenant_id, 'en', 'admin.payments.title', 'Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.title', 'תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.description', 'Manage payments, schedules, and billing', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.description', 'ניהול תשלומים, לוחות זמנים וחשבוניות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports', 'Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports', 'דוחות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.paymentPlans', 'Payment Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.paymentPlans', 'תוכניות תשלום', 'admin', NOW(), NOW()),

  -- Stats Cards
  (v_tenant_id, 'en', 'admin.payments.totalRevenue', 'Total Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.totalRevenue', 'הכנסות כוללות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.fromLastMonth', 'from last month', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.fromLastMonth', 'מהחודש שעבר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.activeEnrollments', 'Active Enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.activeEnrollments', 'הרשמות פעילות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.withActivePayments', 'with active payment plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.withActivePayments', 'עם תוכניות תשלום פעילות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.pendingPayments', 'Pending Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingPayments', 'תשלומים ממתינים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.scheduledUpcoming', 'scheduled upcoming', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.scheduledUpcoming', 'מתוזמנים לעתיד', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.overduePayments', 'Overdue Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.overduePayments', 'תשלומים באיחור', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.viewOverdue', 'View Overdue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.viewOverdue', 'צפה באיחורים', 'admin', NOW(), NOW()),

  -- Pending Amount Card
  (v_tenant_id, 'en', 'admin.payments.pendingAmount', 'Pending Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingAmount', 'סכום ממתין', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.pendingAmount.description', 'Total amount in pending payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingAmount.description', 'סכום כולל בתשלומים ממתינים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.pendingAmount.fromPayments', 'From {count} scheduled payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingAmount.fromPayments', 'מתוך {count} תשלומים מתוזמנים', 'admin', NOW(), NOW()),

  -- Quick Action Cards
  (v_tenant_id, 'en', 'admin.payments.cards.products.title', 'Products', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.products.title', 'מוצרים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.products.description', 'Manage billable products and pricing', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.products.description', 'ניהול מוצרים לחיוב ותמחור', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.paymentPlans.title', 'Payment Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.title', 'תוכניות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.paymentPlans.description', 'Configure and manage payment plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.description', 'הגדרה וניהול תוכניות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.schedules.title', 'Schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.title', 'לוחות זמנים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.schedules.description', 'View and manage payment schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.description', 'צפייה וניהול לוחות זמני תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.transactions.title', 'Transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.title', 'עסקאות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.transactions.description', 'View transaction history and refunds', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.description', 'צפייה בהיסטוריית עסקאות והחזרים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.disputes.title', 'Disputes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.disputes.title', 'מחלוקות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.disputes.description', 'Handle payment disputes and chargebacks', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.disputes.description', 'טיפול במחלוקות תשלום והחזרי חיוב', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.enrollments.title', 'Enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.enrollments.title', 'הרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.enrollments.description', 'Manage user enrollments and payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.enrollments.description', 'ניהול הרשמות משתמשים ותשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.reports.title', 'Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.title', 'דוחות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.cards.reports.description', 'View payment reports and analytics', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.description', 'צפייה בדוחות תשלומים וניתוחים', 'admin', NOW(), NOW()),

  -- Recent Activity Section
  (v_tenant_id, 'en', 'admin.payments.recentActivity', 'Recent Activity', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.recentActivity', 'פעילות אחרונה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.recentActivityDesc', 'Latest payment transactions and updates', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.recentActivityDesc', 'עסקאות ועדכוני תשלום אחרונים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.noRecentActivity', 'No recent activity', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.noRecentActivity', 'אין פעילות אחרונה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactionsWillAppear', 'Recent transactions will appear here', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactionsWillAppear', 'עסקאות אחרונות יופיעו כאן', 'admin', NOW(), NOW()),

  -- Coming Soon Notice
  (v_tenant_id, 'en', 'admin.payments.comingSoon.title', 'Payment System - Coming Soon', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.title', 'מערכת תשלומים - בקרוב', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.description', 'The full payment system is being finalized. Here''s what''s coming:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.description', 'מערכת התשלומים המלאה מסתיימת. הנה מה שמגיע:', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature1', 'Automated payment scheduling and processing', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature1', 'תזמון ועיבוד תשלומים אוטומטי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature2', 'Flexible payment plans (full, installments, deposits)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature2', 'תוכניות תשלום גמישות (מלא, תשלומים, פיקדונות)', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature3', 'Stripe integration for secure payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature3', 'אינטגרציה עם Stripe לתשלומים מאובטחים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature4', 'Comprehensive reporting and analytics', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature4', 'דיווח וניתוח מקיפים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature5', 'Automated payment reminders and notifications', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature5', 'תזכורות והודעות תשלום אוטומטיות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.docsTitle', 'Documentation:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.docsTitle', 'תיעוד:', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc1', 'Payment System Overview', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc1', 'סקירת מערכת התשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc2', 'Payment System API', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc2', 'API מערכת התשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc3', 'Admin Guide', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc3', 'מדריך למנהל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc4', 'Integration Guide', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc4', 'מדריך אינטגרציה', 'admin', NOW(), NOW());

  RAISE NOTICE '✅ Successfully inserted % translations for admin.payments page', (SELECT COUNT(*) FROM translations WHERE tenant_id = v_tenant_id AND translation_key LIKE 'admin.payments%');
  RAISE NOTICE '✅ Tenant ID: %', v_tenant_id;
  RAISE NOTICE '✅ Next steps:';
  RAISE NOTICE '   1. Clear your browser localStorage (or logout/login)';
  RAISE NOTICE '   2. Refresh the admin payments page';
  RAISE NOTICE '   3. Translations should now appear in both English and Hebrew';

END $$;
