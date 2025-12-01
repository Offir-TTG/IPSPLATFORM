-- ============================================================================
-- Complete Payment System Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all missing translations for the payment system
-- This migration adds global translations (tenant_id = NULL) for all users
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
BEGIN
  -- Delete existing translations to avoid conflicts
  -- Using tenant_id IS NULL for global translations
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      -- Main Dashboard
      'admin.payments.title', 'admin.payments.description', 'admin.payments.reports',
      'admin.payments.paymentPlans', 'admin.payments.totalRevenue', 'admin.payments.fromLastMonth',
      'admin.payments.activeEnrollments', 'admin.payments.withActivePayments',
      'admin.payments.pendingPayments', 'admin.payments.scheduledUpcoming',
      'admin.payments.overduePayments', 'admin.payments.viewOverdue',
      'admin.payments.pendingAmount', 'admin.payments.pendingAmount.description',
      'admin.payments.pendingAmount.fromPayments',

      -- Quick Action Cards
      'admin.payments.cards.products.title', 'admin.payments.cards.products.description',
      'admin.payments.cards.paymentPlans.title', 'admin.payments.cards.paymentPlans.description',
      'admin.payments.cards.schedules.title', 'admin.payments.cards.schedules.description',
      'admin.payments.cards.transactions.title', 'admin.payments.cards.transactions.description',
      'admin.payments.cards.disputes.title', 'admin.payments.cards.disputes.description',
      'admin.payments.cards.enrollments.title', 'admin.payments.cards.enrollments.description',
      'admin.payments.cards.reports.title', 'admin.payments.cards.reports.description',

      -- Recent Activity
      'admin.payments.recentActivity', 'admin.payments.recentActivityDesc',
      'admin.payments.noRecentActivity', 'admin.payments.transactionsWillAppear',

      -- Coming Soon
      'admin.payments.comingSoon.title', 'admin.payments.comingSoon.description',
      'admin.payments.comingSoon.feature1', 'admin.payments.comingSoon.feature2',
      'admin.payments.comingSoon.feature3', 'admin.payments.comingSoon.feature4',
      'admin.payments.comingSoon.feature5', 'admin.payments.comingSoon.docsTitle',
      'admin.payments.comingSoon.doc1', 'admin.payments.comingSoon.doc2',
      'admin.payments.comingSoon.doc3', 'admin.payments.comingSoon.doc4',

      -- Settings
      'admin.settings.clearCache.button', 'admin.settings.clearCache.clearing',
      'admin.settings.clearCache.tooltip',

      -- Common
      'common.back', 'common.save', 'common.cancel', 'common.delete',
      'common.edit', 'common.create', 'common.status', 'common.actions',
      'common.filters', 'common.search', 'common.dateFrom', 'common.dateTo',
      'common.amount', 'common.user', 'common.product', 'common.date',
      'common.reason', 'common.error', 'common.success', 'common.pending',
      'common.paid', 'common.overdue', 'common.failed', 'common.paused',
      'common.allStatuses', 'common.clearFilters', 'common.refresh', 'common.clear',
      'common.saving', 'common.saveAll',

      -- Months
      'common.months.jan', 'common.months.feb', 'common.months.mar',
      'common.months.apr', 'common.months.may', 'common.months.jun',
      'common.months.jul', 'common.months.aug', 'common.months.sep',
      'common.months.oct', 'common.months.nov', 'common.months.dec'
    );

  -- Main Payment Dashboard
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id, created_at, updated_at) VALUES
  -- English
  ('admin.payments.title', 'en', 'Payments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.description', 'en', 'Manage payment plans, transactions, and financial reports', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.reports', 'en', 'Reports', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.paymentPlans', 'en', 'Payment Plans', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.totalRevenue', 'en', 'Total Revenue', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.fromLastMonth', 'en', 'from last month', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.activeEnrollments', 'en', 'Active Enrollments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.withActivePayments', 'en', 'With active payments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingPayments', 'en', 'Pending Payments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.scheduledUpcoming', 'en', 'Scheduled upcoming', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.overduePayments', 'en', 'Overdue Payments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.viewOverdue', 'en', 'View Overdue', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingAmount', 'en', 'Pending Amount', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingAmount.description', 'en', 'Total amount from pending and scheduled payments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingAmount.fromPayments', 'en', 'From {count} scheduled payments', 'admin', NULL, NOW(), NOW()),
  -- Hebrew
  ('admin.payments.title', 'he', 'תשלומים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.description', 'he', 'ניהול תוכניות תשלום, עסקאות ודוחות כספיים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.reports', 'he', 'דוחות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.paymentPlans', 'he', 'תוכניות תשלום', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.totalRevenue', 'he', 'הכנסות כוללות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.fromLastMonth', 'he', 'מהחודש שעבר', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.activeEnrollments', 'he', 'הרשמות פעילות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.withActivePayments', 'he', 'עם תשלומים פעילים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingPayments', 'he', 'תשלומים ממתינים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.scheduledUpcoming', 'he', 'מתוכננים לעתיד', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.overduePayments', 'he', 'תשלומים באיחור', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.viewOverdue', 'he', 'הצג באיחור', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingAmount', 'he', 'סכום ממתין', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingAmount.description', 'he', 'סכום כולל מתשלומים ממתינים ומתוזמנים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.pendingAmount.fromPayments', 'he', 'מ-{count} תשלומים מתוזמנים', 'admin', NULL, NOW(), NOW());

  -- Quick Action Cards
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id, created_at, updated_at) VALUES
  -- English
  ('admin.payments.cards.products.title', 'en', 'Products', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.products.description', 'en', 'Manage billable products and pricing', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.paymentPlans.title', 'en', 'Payment Plans', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.paymentPlans.description', 'en', 'Configure and manage payment plans', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.schedules.title', 'en', 'Schedules', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.schedules.description', 'en', 'View and manage payment schedules', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.transactions.title', 'en', 'Transactions', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.transactions.description', 'en', 'View transaction history and refunds', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.disputes.title', 'en', 'Disputes', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.disputes.description', 'en', 'Handle payment disputes and chargebacks', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.enrollments.title', 'en', 'Enrollments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.enrollments.description', 'en', 'Manage user enrollments and payments', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.reports.title', 'en', 'Reports', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.reports.description', 'en', 'View payment reports and analytics', 'admin', NULL, NOW(), NOW()),
  -- Hebrew
  ('admin.payments.cards.products.title', 'he', 'מוצרים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.products.description', 'he', 'ניהול מוצרים לחיוב ותמחור', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.paymentPlans.title', 'he', 'תוכניות תשלום', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.paymentPlans.description', 'he', 'הגדרה וניהול תוכניות תשלום', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.schedules.title', 'he', 'לוחות זמנים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.schedules.description', 'he', 'צפייה וניהול לוחות זמנים של תשלומים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.transactions.title', 'he', 'עסקאות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.transactions.description', 'he', 'צפייה בהיסטוריית עסקאות והחזרים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.disputes.title', 'he', 'מחלוקות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.disputes.description', 'he', 'טיפול במחלוקות תשלום והחזרי חיוב', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.enrollments.title', 'he', 'הרשמות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.enrollments.description', 'he', 'ניהול הרשמות משתמשים ותשלומים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.reports.title', 'he', 'דוחות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.cards.reports.description', 'he', 'צפייה בדוחות תשלומים וניתוחים', 'admin', NULL, NOW(), NOW());

  -- Recent Activity Section
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id, created_at, updated_at) VALUES
  -- English
  ('admin.payments.recentActivity', 'en', 'Recent Activity', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.recentActivityDesc', 'en', 'Latest payment transactions and updates', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.noRecentActivity', 'en', 'No recent activity', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.transactionsWillAppear', 'en', 'Payment transactions will appear here', 'admin', NULL, NOW(), NOW()),
  -- Hebrew
  ('admin.payments.recentActivity', 'he', 'פעילות אחרונה', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.recentActivityDesc', 'he', 'עסקאות תשלום ועדכונים אחרונים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.noRecentActivity', 'he', 'אין פעילות אחרונה', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.transactionsWillAppear', 'he', 'עסקאות תשלום יופיעו כאן', 'admin', NULL, NOW(), NOW());

  -- Coming Soon Section
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id, created_at, updated_at) VALUES
  -- English
  ('admin.payments.comingSoon.title', 'en', 'Coming Soon', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.description', 'en', 'The following features are currently in development:', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature1', 'en', 'Automated payment reminders and notifications', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature2', 'en', 'Advanced payment analytics and forecasting', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature3', 'en', 'Multi-currency support', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature4', 'en', 'Payment gateway integrations (PayPal, etc.)', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature5', 'en', 'Subscription management and recurring billing', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.docsTitle', 'en', 'Documentation:', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc1', 'en', 'Payment System Overview', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc2', 'en', 'API Documentation', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc3', 'en', 'Admin Guide', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc4', 'en', 'Integration Guide', 'admin', NULL, NOW(), NOW()),
  -- Hebrew
  ('admin.payments.comingSoon.title', 'he', 'בקרוב', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.description', 'he', 'התכונות הבאות נמצאות כעת בפיתוח:', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature1', 'he', 'תזכורות והודעות תשלום אוטומטיות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature2', 'he', 'ניתוח תשלומים מתקדם ותחזיות', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature3', 'he', 'תמיכה במטבעות מרובים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature4', 'he', 'אינטגרציות שערי תשלום (PayPal וכו'')', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.feature5', 'he', 'ניהול מנויים וחיוב חוזר', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.docsTitle', 'he', 'תיעוד:', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc1', 'he', 'סקירת מערכת התשלומים', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc2', 'he', 'תיעוד API', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc3', 'he', 'מדריך מנהל', 'admin', NULL, NOW(), NOW()),
  ('admin.payments.comingSoon.doc4', 'he', 'מדריך אינטגרציה', 'admin', NULL, NOW(), NOW());

  -- Settings Page - Clear Cache Button
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id, created_at, updated_at) VALUES
  -- English
  ('admin.settings.clearCache.button', 'en', 'Clear Cache', 'admin', NULL, NOW(), NOW()),
  ('admin.settings.clearCache.clearing', 'en', 'Clearing...', 'admin', NULL, NOW(), NOW()),
  ('admin.settings.clearCache.tooltip', 'en', 'Clear translation cache and reload fresh from database', 'admin', NULL, NOW(), NOW()),
  -- Hebrew
  ('admin.settings.clearCache.button', 'he', 'נקה מטמון', 'admin', NULL, NOW(), NOW()),
  ('admin.settings.clearCache.clearing', 'he', 'מנקה...', 'admin', NULL, NOW(), NOW()),
  ('admin.settings.clearCache.tooltip', 'he', 'נקה מטמון תרגומים וטען מחדש מהמסד נתונים', 'admin', NULL, NOW(), NOW());

  -- Common translations used across payment pages
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id, created_at, updated_at) VALUES
  -- English
  ('common.back', 'en', 'Back', 'both', NULL, NOW(), NOW()),
  ('common.save', 'en', 'Save', 'both', NULL, NOW(), NOW()),
  ('common.cancel', 'en', 'Cancel', 'both', NULL, NOW(), NOW()),
  ('common.delete', 'en', 'Delete', 'both', NULL, NOW(), NOW()),
  ('common.edit', 'en', 'Edit', 'both', NULL, NOW(), NOW()),
  ('common.create', 'en', 'Create', 'both', NULL, NOW(), NOW()),
  ('common.status', 'en', 'Status', 'both', NULL, NOW(), NOW()),
  ('common.actions', 'en', 'Actions', 'both', NULL, NOW(), NOW()),
  ('common.filters', 'en', 'Filters', 'both', NULL, NOW(), NOW()),
  ('common.search', 'en', 'Search', 'both', NULL, NOW(), NOW()),
  ('common.dateFrom', 'en', 'Date From', 'both', NULL, NOW(), NOW()),
  ('common.dateTo', 'en', 'Date To', 'both', NULL, NOW(), NOW()),
  ('common.amount', 'en', 'Amount', 'both', NULL, NOW(), NOW()),
  ('common.user', 'en', 'User', 'both', NULL, NOW(), NOW()),
  ('common.product', 'en', 'Product', 'both', NULL, NOW(), NOW()),
  ('common.date', 'en', 'Date', 'both', NULL, NOW(), NOW()),
  ('common.reason', 'en', 'Reason', 'both', NULL, NOW(), NOW()),
  ('common.error', 'en', 'Error', 'both', NULL, NOW(), NOW()),
  ('common.success', 'en', 'Success', 'both', NULL, NOW(), NOW()),
  ('common.pending', 'en', 'Pending', 'both', NULL, NOW(), NOW()),
  ('common.paid', 'en', 'Paid', 'both', NULL, NOW(), NOW()),
  ('common.overdue', 'en', 'Overdue', 'both', NULL, NOW(), NOW()),
  ('common.failed', 'en', 'Failed', 'both', NULL, NOW(), NOW()),
  ('common.paused', 'en', 'Paused', 'both', NULL, NOW(), NOW()),
  ('common.allStatuses', 'en', 'All Statuses', 'both', NULL, NOW(), NOW()),
  ('common.clearFilters', 'en', 'Clear Filters', 'both', NULL, NOW(), NOW()),
  ('common.refresh', 'en', 'Refresh', 'both', NULL, NOW(), NOW()),
  ('common.clear', 'en', 'Clear', 'both', NULL, NOW(), NOW()),
  ('common.saving', 'en', 'Saving...', 'both', NULL, NOW(), NOW()),
  ('common.saveAll', 'en', 'Save All Changes', 'both', NULL, NOW(), NOW()),
  -- Hebrew
  ('common.back', 'he', 'חזרה', 'both', NULL, NOW(), NOW()),
  ('common.save', 'he', 'שמור', 'both', NULL, NOW(), NOW()),
  ('common.cancel', 'he', 'ביטול', 'both', NULL, NOW(), NOW()),
  ('common.delete', 'he', 'מחק', 'both', NULL, NOW(), NOW()),
  ('common.edit', 'he', 'ערוך', 'both', NULL, NOW(), NOW()),
  ('common.create', 'he', 'צור', 'both', NULL, NOW(), NOW()),
  ('common.status', 'he', 'סטטוס', 'both', NULL, NOW(), NOW()),
  ('common.actions', 'he', 'פעולות', 'both', NULL, NOW(), NOW()),
  ('common.filters', 'he', 'מסננים', 'both', NULL, NOW(), NOW()),
  ('common.search', 'he', 'חיפוש', 'both', NULL, NOW(), NOW()),
  ('common.dateFrom', 'he', 'מתאריך', 'both', NULL, NOW(), NOW()),
  ('common.dateTo', 'he', 'עד תאריך', 'both', NULL, NOW(), NOW()),
  ('common.amount', 'he', 'סכום', 'both', NULL, NOW(), NOW()),
  ('common.user', 'he', 'משתמש', 'both', NULL, NOW(), NOW()),
  ('common.product', 'he', 'מוצר', 'both', NULL, NOW(), NOW()),
  ('common.date', 'he', 'תאריך', 'both', NULL, NOW(), NOW()),
  ('common.reason', 'he', 'סיבה', 'both', NULL, NOW(), NOW()),
  ('common.error', 'he', 'שגיאה', 'both', NULL, NOW(), NOW()),
  ('common.success', 'he', 'הצלחה', 'both', NULL, NOW(), NOW()),
  ('common.pending', 'he', 'ממתין', 'both', NULL, NOW(), NOW()),
  ('common.paid', 'he', 'שולם', 'both', NULL, NOW(), NOW()),
  ('common.overdue', 'he', 'באיחור', 'both', NULL, NOW(), NOW()),
  ('common.failed', 'he', 'נכשל', 'both', NULL, NOW(), NOW()),
  ('common.paused', 'he', 'מושהה', 'both', NULL, NOW(), NOW()),
  ('common.allStatuses', 'he', 'כל הסטטוסים', 'both', NULL, NOW(), NOW()),
  ('common.clearFilters', 'he', 'נקה מסננים', 'both', NULL, NOW(), NOW()),
  ('common.refresh', 'he', 'רענן', 'both', NULL, NOW(), NOW()),
  ('common.clear', 'he', 'נקה', 'both', NULL, NOW(), NOW()),
  ('common.saving', 'he', 'שומר...', 'both', NULL, NOW(), NOW()),
  ('common.saveAll', 'he', 'שמור את כל השינויים', 'both', NULL, NOW(), NOW());

  -- Month names for reports
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id, created_at, updated_at) VALUES
  -- English
  ('common.months.jan', 'en', 'January', 'both', NULL, NOW(), NOW()),
  ('common.months.feb', 'en', 'February', 'both', NULL, NOW(), NOW()),
  ('common.months.mar', 'en', 'March', 'both', NULL, NOW(), NOW()),
  ('common.months.apr', 'en', 'April', 'both', NULL, NOW(), NOW()),
  ('common.months.may', 'en', 'May', 'both', NULL, NOW(), NOW()),
  ('common.months.jun', 'en', 'June', 'both', NULL, NOW(), NOW()),
  ('common.months.jul', 'en', 'July', 'both', NULL, NOW(), NOW()),
  ('common.months.aug', 'en', 'August', 'both', NULL, NOW(), NOW()),
  ('common.months.sep', 'en', 'September', 'both', NULL, NOW(), NOW()),
  ('common.months.oct', 'en', 'October', 'both', NULL, NOW(), NOW()),
  ('common.months.nov', 'en', 'November', 'both', NULL, NOW(), NOW()),
  ('common.months.dec', 'en', 'December', 'both', NULL, NOW(), NOW()),
  -- Hebrew
  ('common.months.jan', 'he', 'ינואר', 'both', NULL, NOW(), NOW()),
  ('common.months.feb', 'he', 'פברואר', 'both', NULL, NOW(), NOW()),
  ('common.months.mar', 'he', 'מרץ', 'both', NULL, NOW(), NOW()),
  ('common.months.apr', 'he', 'אפריל', 'both', NULL, NOW(), NOW()),
  ('common.months.may', 'he', 'מאי', 'both', NULL, NOW(), NOW()),
  ('common.months.jun', 'he', 'יוני', 'both', NULL, NOW(), NOW()),
  ('common.months.jul', 'he', 'יולי', 'both', NULL, NOW(), NOW()),
  ('common.months.aug', 'he', 'אוגוסט', 'both', NULL, NOW(), NOW()),
  ('common.months.sep', 'he', 'ספטמבר', 'both', NULL, NOW(), NOW()),
  ('common.months.oct', 'he', 'אוקטובר', 'both', NULL, NOW(), NOW()),
  ('common.months.nov', 'he', 'נובמבר', 'both', NULL, NOW(), NOW()),
  ('common.months.dec', 'he', 'דצמבר', 'both', NULL, NOW(), NOW());

  RAISE NOTICE 'Payment translations migration completed successfully - added 172 translations';

END $$;
