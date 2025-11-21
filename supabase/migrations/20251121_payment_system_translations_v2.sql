-- ============================================================================
-- Payment System Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for Payment System
-- Author: System
-- Date: 2025-01-22

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN
  -- Using the same tenant ID as other migrations
  -- If you need to use a different tenant, change the UUID above

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- ============================================================================
  -- ENGLISH TRANSLATIONS - Main Navigation
  -- ============================================================================

  -- Delete existing translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
  AND language_code IN ('en', 'he')
  AND (translation_key LIKE 'admin.payments%' OR translation_key = 'admin.nav.payments');

  -- Insert all translations in a single statement
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  (v_tenant_id, 'en', 'admin.nav.payments', 'Payments', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- ENGLISH TRANSLATIONS - Payment Dashboard
  -- ============================================================================

  (v_tenant_id, 'en', 'admin.payments.title', 'Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.description', 'Manage payment plans, schedules, and transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports', 'Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.paymentPlans', 'Payment Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.totalRevenue', 'Total Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.activeEnrollments', 'Active Enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.pendingPayments', 'Pending Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.overduePayments', 'Overdue Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.mrr', 'Monthly Recurring Revenue (MRR)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.arr', 'ARR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.withActivePayments', 'With active payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.scheduledUpcoming', 'Scheduled upcoming', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.viewOverdue', 'View overdue →', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.revenueFromSubscriptions', 'Revenue from active subscriptions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.perMonth', '/mo', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.perYear', '/year', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.quickActions', 'Quick Actions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.recentActivity', 'Recent Activity', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.recentActivityDesc', 'Latest payment transactions and adjustments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.noRecentActivity', 'No recent activity', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.transactionsWillAppear', 'Payment transactions will appear here', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.fromLastMonth', 'from last month', 'admin', NOW(), NOW()),

  -- Coming Soon Notice
  (v_tenant_id, 'en', 'admin.payments.comingSoon.title', 'Payment System Implementation', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.description', 'The payment system is currently under development. The following features will be available soon:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature1', 'Automatic payment plan detection based on product rules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature2', 'Admin controls for payment schedule adjustments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature3', 'Comprehensive revenue and cash flow reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature4', 'Stripe integration for all payment types', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.feature5', 'Support for: one-time, deposit, installments, and subscriptions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.docsTitle', 'Documentation:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc1', 'PAYMENT_SYSTEM.md - Complete architecture', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc2', 'PAYMENT_SYSTEM_API.md - API reference', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc3', 'PAYMENT_SYSTEM_ADMIN_GUIDE.md - Admin operations', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.comingSoon.doc4', 'PAYMENT_INTEGRATION_GUIDE.md - Integration with courses/programs', 'admin', NOW(), NOW()),

  -- Quick Action Cards
  (v_tenant_id, 'en', 'admin.payments.cards.paymentPlans.title', 'Payment Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.cards.paymentPlans.description', 'Create and manage payment plan templates', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.cards.schedules.title', 'Payment Schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.cards.schedules.description', 'View and adjust payment dates', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.cards.transactions.title', 'Transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.cards.transactions.description', 'View all payment transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.cards.reports.title', 'Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.cards.reports.description', 'Revenue and payment analytics', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- ENGLISH TRANSLATIONS - Payment Plans Page
  -- ============================================================================

  (v_tenant_id, 'en', 'admin.payments.plans.title', 'Payment Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.description', 'Create and manage reusable payment plan templates', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.createPlan', 'Create Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.autoDetection', 'Auto-Detection', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.autoDetectionDesc', 'Payment plans with auto-detection enabled will be automatically assigned to products based on their rules and priority. Higher priority plans are evaluated first.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.priority', 'Priority', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.enrollments', 'enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.preferredPlan', 'Preferred Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.default', 'Default', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.autoDetect', 'Auto-Detect', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.inactive', 'Inactive', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.noPlans', 'No payment plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.noPlansDesc', 'Create your first payment plan to get started', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.deleteConfirm', 'Are you sure you want to delete this payment plan?', 'admin', NOW(), NOW()),

  -- Plan Types
  (v_tenant_id, 'en', 'admin.payments.plans.types.oneTime', 'One-Time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.types.deposit', 'Deposit', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.types.installments', 'Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.types.subscription', 'Subscription', 'admin', NOW(), NOW()),

  -- Plan Form
  (v_tenant_id, 'en', 'admin.payments.plans.form.createTitle', 'Create Payment Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.editTitle', 'Edit Payment Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.description', 'Configure the payment plan settings and auto-detection rules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.planName', 'Plan Name', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.planNamePlaceholder', 'e.g., 30% Deposit + 6 Months', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.planDescription', 'Description', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.planDescriptionPlaceholder', 'Brief description of this payment plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.planType', 'Plan Type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.oneTimePayment', 'One-Time Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.depositInstallments', 'Deposit + Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.installmentsOnly', 'Installments Only', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.subscription', 'Subscription', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.depositConfig', 'Deposit Configuration', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.depositPercentage', 'Deposit Percentage', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.installmentsConfig', 'Installments Configuration', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.numberOfInstallments', 'Number of Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.frequency', 'Frequency', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.selectFrequency', 'Select frequency', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.weekly', 'Weekly', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.biweekly', 'Bi-weekly', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.monthly', 'Monthly', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.quarterly', 'Quarterly', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.annually', 'Annually', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.subscriptionConfig', 'Subscription Configuration', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.billingFrequency', 'Billing Frequency', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.settings', 'Settings', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.priorityDesc', 'Higher priority plans are evaluated first during auto-detection', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.autoDetectionEnabled', 'Auto-Detection', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.autoDetectionDesc', 'Automatically assign this plan based on rules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.active', 'Active', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.activeDesc', 'Inactive plans won''t be assigned to new enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.defaultPlan', 'Default Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.defaultPlanDesc', 'Use if no auto-detection rules match', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.cancel', 'Cancel', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.saveChanges', 'Save Changes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.plans.form.createPlan', 'Create Plan', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- ENGLISH TRANSLATIONS - Payment Schedules (used in reports)
  -- ============================================================================

  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.paid', 'Paid', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.partial', 'Partial', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.pending', 'Pending', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.overdue', 'Overdue', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- ENGLISH TRANSLATIONS - Reports Page
  -- ============================================================================


  (v_tenant_id, 'en', 'admin.payments.reports.title', 'Payment Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.description', 'Comprehensive analytics and insights', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.export', 'Export', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.today', 'Today', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.last7Days', 'Last 7 Days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.last30Days', 'Last 30 Days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.last90Days', 'Last 90 Days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.thisYear', 'This Year', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.customRange', 'Custom Range', 'admin', NOW(), NOW()),

  -- Report Tabs and General Report Keys
  (v_tenant_id, 'en', 'admin.payments.reports.avgTransaction', 'Avg Transaction', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.arrDescription', 'Annual recurring revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenueTrend', 'Revenue Trend', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenueTrendDescription', 'Daily revenue over selected period', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenueByType', 'Revenue by Payment Type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenueByTypeDescription', 'Breakdown of revenue sources', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenueDistribution', 'Revenue Distribution', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenueDistributionDescription', 'Amount by payment type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.mrrGrowth', 'MRR Growth', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.mrrGrowthDescription', 'Monthly recurring revenue breakdown', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.tabs.revenue', 'Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.tabs.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.tabs.cashflow', 'Cash Flow', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.tabs.products', 'Products', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.tabs.users', 'Users', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.tabs.plans', 'Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.tabs.operational', 'Operational', 'admin', NOW(), NOW()),

  -- Revenue Report
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.totalRevenue', 'Total Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.avgTransaction', 'Avg Transaction', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.revenueTrend', 'Revenue Trend', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.dailyRevenue', 'Daily revenue over selected period', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.byType', 'Revenue by Payment Type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.breakdown', 'Breakdown of revenue sources', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.distribution', 'Revenue Distribution', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.amountByType', 'Amount by payment type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.mrrGrowth', 'MRR Growth', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.mrrBreakdown', 'Monthly recurring revenue breakdown', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.newMRR', 'New MRR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.expansion', 'Expansion', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.revenue.churn', 'Churn', 'admin', NOW(), NOW()),

  -- Status Report
  
  (v_tenant_id, 'en', 'admin.payments.reports.status.paid', 'Paid', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.partial', 'Partial', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.pending', 'Pending', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.overdue', 'Overdue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.distribution', 'Payment Status Distribution', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.byCount', 'By enrollment count', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.completionRate', 'Payment Completion Rate', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.paymentHealth', 'Overall payment health', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.onTime', 'On-Time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.late', 'Late', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.default', 'Default', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.overdueAging', 'Overdue Payment Aging', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.daysOverdue', 'Days overdue distribution', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.overduePayments', 'Overdue Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.requiresAttention', 'Payments requiring attention', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.payments.reports.status.daysOverdueCount', 'days overdue', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- HEBREW TRANSLATIONS - Main Navigation
  -- ============================================================================

  
  (v_tenant_id, 'he', 'admin.nav.payments', 'תשלומים', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- HEBREW TRANSLATIONS - Payment Dashboard
  -- ============================================================================

  
  (v_tenant_id, 'he', 'admin.payments.title', 'תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.description', 'ניהול תוכניות תשלום, לוחות זמנים ועסקאות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports', 'דוחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.paymentPlans', 'תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.totalRevenue', 'הכנסות כוללות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.activeEnrollments', 'רישומים פעילים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.pendingPayments', 'תשלומים ממתינים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.overduePayments', 'תשלומים באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.mrr', 'הכנסה חודשית חוזרת (MRR)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.arr', 'הכנסה שנתית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.withActivePayments', 'עם תשלומים פעילים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.scheduledUpcoming', 'מתוזמנים בקרוב', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.viewOverdue', 'צפה באיחורים ←', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.revenueFromSubscriptions', 'הכנסה ממנויים פעילים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.perMonth', '/חודש', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.perYear', '/שנה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.quickActions', 'פעולות מהירות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.recentActivity', 'פעילות אחרונה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.recentActivityDesc', 'עסקאות תשלום והתאמות אחרונות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.noRecentActivity', 'אין פעילות אחרונה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactionsWillAppear', 'עסקאות תשלום יופיעו כאן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.fromLastMonth', 'מהחודש שעבר', 'admin', NOW(), NOW()),

  -- Coming Soon Notice
  (v_tenant_id, 'he', 'admin.payments.comingSoon.title', 'יישום מערכת תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.description', 'מערכת התשלומים נמצאת כעת בפיתוח. התכונות הבאות יהיו זמינות בקרוב:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature1', 'זיהוי אוטומטי של תוכנית תשלום על סמך כללי מוצר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature2', 'בקרות מנהל להתאמת לוח זמנים לתשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature3', 'דוחות מקיפים של הכנסות ותזרים מזומנים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature4', 'אינטגרציה עם Stripe לכל סוגי התשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.feature5', 'תמיכה ב: חד פעמי, מקדמה, תשלומים ומנויים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.docsTitle', 'תיעוד:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc1', 'PAYMENT_SYSTEM.md - ארכיטקטורה מלאה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc2', 'PAYMENT_SYSTEM_API.md - הפניית API', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc3', 'PAYMENT_SYSTEM_ADMIN_GUIDE.md - פעולות מנהל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.comingSoon.doc4', 'PAYMENT_INTEGRATION_GUIDE.md - אינטגרציה עם קורסים/תוכניות', 'admin', NOW(), NOW()),

  -- Quick Action Cards

  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.title', 'תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.paymentPlans.description', 'יצירה וניהול תבניות תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.title', 'לוחות זמנים לתשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.schedules.description', 'צפייה והתאמת תאריכי תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.title', 'עסקאות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.transactions.description', 'צפייה בכל עסקאות התשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.title', 'דוחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.cards.reports.description', 'ניתוח הכנסות ותשלומים', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- HEBREW TRANSLATIONS - Payment Plans Page
  -- ============================================================================

  
  (v_tenant_id, 'he', 'admin.payments.plans.title', 'תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.description', 'יצירה וניהול תבניות תוכניות תשלום לשימוש חוזר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.createPlan', 'צור תוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.autoDetection', 'זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.autoDetectionDesc', 'תוכניות תשלום עם זיהוי אוטומטי מופעל יוקצו אוטומטית למוצרים על סמך הכללים והעדיפות שלהן. תוכניות בעדיפות גבוהה יותר יוערכו ראשונות.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.priority', 'עדיפות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.enrollments', 'רישומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.preferredPlan', 'תוכנית מועדפת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.default', 'ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.autoDetect', 'זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.inactive', 'לא פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.noPlans', 'אין תוכניות תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.noPlansDesc', 'צור את תוכנית התשלום הראשונה שלך כדי להתחיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.deleteConfirm', 'האם אתה בטוח שברצונך למחוק תוכנית תשלום זו?', 'admin', NOW(), NOW()),

  -- Plan Types
  
  (v_tenant_id, 'he', 'admin.payments.plans.types.oneTime', 'תשלום חד פעמי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.deposit', 'מקדמה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.installments', 'תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.subscription', 'מנוי', 'admin', NOW(), NOW()),

  -- Plan Form
  
  (v_tenant_id, 'he', 'admin.payments.plans.form.createTitle', 'צור תוכנית תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.editTitle', 'ערוך תוכנית תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.description', 'הגדר את הגדרות תוכנית התשלום וכללי הזיהוי האוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planName', 'שם תוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planNamePlaceholder', 'לדוגמה: מקדמה 30% + 6 חודשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planDescription', 'תיאור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planDescriptionPlaceholder', 'תיאור קצר של תוכנית תשלום זו', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.planType', 'סוג תוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.oneTimePayment', 'תשלום חד פעמי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.depositInstallments', 'מקדמה + תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.installmentsOnly', 'תשלומים בלבד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.subscription', 'מנוי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.depositConfig', 'הגדרות מקדמה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.depositPercentage', 'אחוז מקדמה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.installmentsConfig', 'הגדרות תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.numberOfInstallments', 'מספר תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.frequency', 'תדירות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.selectFrequency', 'בחר תדירות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.weekly', 'שבועי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.biweekly', 'דו-שבועי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.monthly', 'חודשי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.quarterly', 'רבעוני', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.annually', 'שנתי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.subscriptionConfig', 'הגדרות מנוי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.billingFrequency', 'תדירות חיוב', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.settings', 'הגדרות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.priorityDesc', 'תוכניות בעדיפות גבוהה יותר יוערכו ראשונות בזמן זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.autoDetectionEnabled', 'זיהוי אוטומטי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.autoDetectionDesc', 'הקצה תוכנית זו אוטומטית על סמך כללים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.active', 'פעיל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.activeDesc', 'תוכניות לא פעילות לא יוקצו לרישומים חדשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.defaultPlan', 'תוכנית ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.defaultPlanDesc', 'השתמש אם אין כללי זיהוי אוטומטי מתאימים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.cancel', 'ביטול', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.saveChanges', 'שמור שינויים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.form.createPlan', 'צור תוכנית', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- HEBREW TRANSLATIONS - Payment Schedules (used in reports)
  -- ============================================================================

  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.paid', 'שולם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.partial', 'חלקי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.pending', 'ממתין', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.overdue', 'באיחור', 'admin', NOW(), NOW()),

  -- ============================================================================
  -- HEBREW TRANSLATIONS - Reports Page
  -- ============================================================================


  (v_tenant_id, 'he', 'admin.payments.reports.title', 'דוחות תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.description', 'ניתוח ותובנות מקיפים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.export', 'ייצוא', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.today', 'היום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last7Days', '7 ימים אחרונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last30Days', '30 ימים אחרונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last90Days', '90 ימים אחרונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.thisYear', 'השנה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.customRange', 'טווח מותאם', 'admin', NOW(), NOW()),

  -- Report Tabs and General Report Keys
  (v_tenant_id, 'he', 'admin.payments.reports.avgTransaction', 'ממוצע עסקה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.arrDescription', 'הכנסה שנתית חוזרת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueTrend', 'מגמת הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueTrendDescription', 'הכנסות יומיות בתקופה שנבחרה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByType', 'הכנסות לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByTypeDescription', 'פירוט מקורות הכנסה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueDistribution', 'התפלגות הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueDistributionDescription', 'סכום לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.mrrGrowth', 'צמיחת MRR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.mrrGrowthDescription', 'פירוט הכנסה חודשית חוזרת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'he', 'admin.payments.reports.tabs.revenue', 'הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.status', 'סטטוס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.cashflow', 'תזרים מזומנים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.products', 'מוצרים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.users', 'משתמשים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.plans', 'תוכניות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.operational', 'תפעולי', 'admin', NOW(), NOW()),

  -- Revenue Report
  
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.totalRevenue', 'הכנסות כוללות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.avgTransaction', 'ממוצע עסקה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.revenueTrend', 'מגמת הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.dailyRevenue', 'הכנסות יומיות בתקופה שנבחרה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.byType', 'הכנסות לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.breakdown', 'פירוט מקורות הכנסה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.distribution', 'התפלגות הכנסות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.amountByType', 'סכום לפי סוג תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.mrrGrowth', 'צמיחת MRR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.mrrBreakdown', 'פירוט הכנסה חודשית חוזרת', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.newMRR', 'MRR חדש', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.expansion', 'הרחבה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenue.churn', 'נטישה', 'admin', NOW(), NOW()),

  -- Status Report
  
  (v_tenant_id, 'he', 'admin.payments.reports.status.paid', 'שולם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.partial', 'חלקי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.pending', 'ממתין', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.overdue', 'באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.distribution', 'התפלגות סטטוס תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.byCount', 'לפי מספר רישומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.completionRate', 'שיעור השלמת תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.paymentHealth', 'בריאות תשלום כללית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.onTime', 'בזמן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.late', 'מאוחר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.default', 'ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.overdueAging', 'הזדקנות תשלומים באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.daysOverdue', 'התפלגות ימי איחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.overduePayments', 'תשלומים באיחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.requiresAttention', 'תשלומים הדורשים תשומת לב', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.status.daysOverdueCount', 'ימים באיחור', 'admin', NOW(), NOW());

  RAISE NOTICE 'Payment system translations added successfully for tenant: %', v_tenant_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding payment system translations: %', SQLERRM;
    RAISE;
END $$;
