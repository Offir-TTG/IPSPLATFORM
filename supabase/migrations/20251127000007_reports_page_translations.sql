-- ============================================================================
-- Payment Reports Page Complete Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all translations for the payment reports page
-- This migration adds global translations (tenant_id = NULL) for all users
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Delete existing reports translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'admin.payments.reports.%';

  -- ============================================================================
  -- PAYMENT REPORTS PAGE - MAIN TRANSLATIONS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Page Header
    ('admin.payments.reports.title', 'en', 'Payment Reports', 'admin', NULL::uuid),
    ('admin.payments.reports.title', 'he', 'דוחות תשלומים', 'admin', NULL::uuid),
    ('admin.payments.reports.description', 'en', 'Comprehensive payment analytics and insights', 'admin', NULL::uuid),
    ('admin.payments.reports.description', 'he', 'ניתוח ותובנות תשלומים מקיפים', 'admin', NULL::uuid),
    ('admin.payments.reports.export', 'en', 'Export', 'admin', NULL::uuid),
    ('admin.payments.reports.export', 'he', 'ייצוא', 'admin', NULL::uuid),

    -- Date Range Options
    ('admin.payments.reports.today', 'en', 'Today', 'admin', NULL::uuid),
    ('admin.payments.reports.today', 'he', 'היום', 'admin', NULL::uuid),
    ('admin.payments.reports.last7Days', 'en', 'Last 7 Days', 'admin', NULL::uuid),
    ('admin.payments.reports.last7Days', 'he', '7 ימים אחרונים', 'admin', NULL::uuid),
    ('admin.payments.reports.last30Days', 'en', 'Last 30 Days', 'admin', NULL::uuid),
    ('admin.payments.reports.last30Days', 'he', '30 ימים אחרונים', 'admin', NULL::uuid),
    ('admin.payments.reports.last90Days', 'en', 'Last 90 Days', 'admin', NULL::uuid),
    ('admin.payments.reports.last90Days', 'he', '90 ימים אחרונים', 'admin', NULL::uuid),
    ('admin.payments.reports.thisYear', 'en', 'This Year', 'admin', NULL::uuid),
    ('admin.payments.reports.thisYear', 'he', 'שנה זו', 'admin', NULL::uuid),
    ('admin.payments.reports.customRange', 'en', 'Custom Range', 'admin', NULL::uuid),
    ('admin.payments.reports.customRange', 'he', 'טווח מותאם אישית', 'admin', NULL::uuid),

    -- Report Tabs
    ('admin.payments.reports.tabs.revenue', 'en', 'Revenue', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.revenue', 'he', 'הכנסות', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.status', 'en', 'Status', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.status', 'he', 'סטטוס', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.cashflow', 'en', 'Cash Flow', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.cashflow', 'he', 'תזרים מזומנים', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.products', 'en', 'Products', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.products', 'he', 'מוצרים', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.users', 'en', 'Users', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.users', 'he', 'משתמשים', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.plans', 'en', 'Plans', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.plans', 'he', 'תוכניות', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.operational', 'en', 'Operational', 'admin', NULL::uuid),
    ('admin.payments.reports.tabs.operational', 'he', 'תפעולי', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- ============================================================================
  -- REVENUE REPORT
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.avgTransaction', 'en', 'Avg Transaction', 'admin', NULL::uuid),
    ('admin.payments.reports.avgTransaction', 'he', 'עסקה ממוצעת', 'admin', NULL::uuid),
    ('admin.payments.mrr', 'en', 'MRR', 'admin', NULL::uuid),
    ('admin.payments.mrr', 'he', 'MRR', 'admin', NULL::uuid),
    ('admin.payments.arr', 'en', 'ARR', 'admin', NULL::uuid),
    ('admin.payments.arr', 'he', 'ARR', 'admin', NULL::uuid),
    ('admin.payments.reports.arrDescription', 'en', 'Annual Recurring Revenue', 'admin', NULL::uuid),
    ('admin.payments.reports.arrDescription', 'he', 'הכנסות שנתיות חוזרות', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueTrend', 'en', 'Revenue Trend', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueTrend', 'he', 'מגמת הכנסות', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueTrendDescription', 'en', 'Revenue performance over time', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueTrendDescription', 'he', 'ביצועי הכנסות לאורך זמן', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByType', 'en', 'Revenue by Type', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByType', 'he', 'הכנסות לפי סוג', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByTypeDescription', 'en', 'Revenue breakdown by payment type', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByTypeDescription', 'he', 'פירוט הכנסות לפי סוג תשלום', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueDistribution', 'en', 'Revenue Distribution', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueDistribution', 'he', 'התפלגות הכנסות', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueDistributionDescription', 'en', 'Detailed revenue distribution breakdown', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueDistributionDescription', 'he', 'פירוט מפורט של התפלגות הכנסות', 'admin', NULL::uuid),
    ('admin.payments.reports.mrrGrowth', 'en', 'MRR Growth', 'admin', NULL::uuid),
    ('admin.payments.reports.mrrGrowth', 'he', 'צמיחת MRR', 'admin', NULL::uuid),
    ('admin.payments.reports.mrrGrowthDescription', 'en', 'Monthly recurring revenue growth analysis', 'admin', NULL::uuid),
    ('admin.payments.reports.mrrGrowthDescription', 'he', 'ניתוח צמיחת הכנסות חודשיות חוזרות', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- PAYMENT STATUS REPORT
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.statusDistribution', 'en', 'Status Distribution', 'admin', NULL::uuid),
    ('admin.payments.reports.statusDistribution', 'he', 'התפלגות סטטוס', 'admin', NULL::uuid),
    ('admin.payments.reports.statusDistributionDescription', 'en', 'Payment status breakdown', 'admin', NULL::uuid),
    ('admin.payments.reports.statusDistributionDescription', 'he', 'פירוט סטטוס תשלומים', 'admin', NULL::uuid),
    ('admin.payments.reports.completionRate', 'en', 'Completion Rate', 'admin', NULL::uuid),
    ('admin.payments.reports.completionRate', 'he', 'שיעור השלמה', 'admin', NULL::uuid),
    ('admin.payments.reports.completionRateDescription', 'en', 'Payment completion analysis', 'admin', NULL::uuid),
    ('admin.payments.reports.completionRateDescription', 'he', 'ניתוח השלמת תשלומים', 'admin', NULL::uuid),
    ('admin.payments.reports.onTime', 'en', 'On Time', 'admin', NULL::uuid),
    ('admin.payments.reports.onTime', 'he', 'בזמן', 'admin', NULL::uuid),
    ('admin.payments.reports.late', 'en', 'Late', 'admin', NULL::uuid),
    ('admin.payments.reports.late', 'he', 'באיחור', 'admin', NULL::uuid),
    ('admin.payments.reports.default', 'en', 'Default', 'admin', NULL::uuid),
    ('admin.payments.reports.default', 'he', 'ברירת מחדל', 'admin', NULL::uuid),
    ('admin.payments.reports.overdueAging', 'en', 'Overdue Aging', 'admin', NULL::uuid),
    ('admin.payments.reports.overdueAging', 'he', 'התיישנות באיחור', 'admin', NULL::uuid),
    ('admin.payments.reports.overdueAgingDescription', 'en', 'Age analysis of overdue payments', 'admin', NULL::uuid),
    ('admin.payments.reports.overdueAgingDescription', 'he', 'ניתוח גיל של תשלומים באיחור', 'admin', NULL::uuid),
    ('admin.payments.reports.overduePayments', 'en', 'Overdue Payments', 'admin', NULL::uuid),
    ('admin.payments.reports.overduePayments', 'he', 'תשלומים באיחור', 'admin', NULL::uuid),
    ('admin.payments.reports.overduePaymentsDescription', 'en', 'List of overdue payment details', 'admin', NULL::uuid),
    ('admin.payments.reports.overduePaymentsDescription', 'he', 'רשימת פרטי תשלומים באיחור', 'admin', NULL::uuid),
    ('admin.payments.reports.daysOverdue', 'en', 'days overdue', 'admin', NULL::uuid),
    ('admin.payments.reports.daysOverdue', 'he', 'ימי איחור', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- CASH FLOW REPORT
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.expectedThisMonth', 'en', 'Expected This Month', 'admin', NULL::uuid),
    ('admin.payments.reports.expectedThisMonth', 'he', 'צפוי החודש', 'admin', NULL::uuid),
    ('admin.payments.reports.fromAllSources', 'en', 'From all sources', 'admin', NULL::uuid),
    ('admin.payments.reports.fromAllSources', 'he', 'מכל המקורות', 'admin', NULL::uuid),
    ('admin.payments.reports.received', 'en', 'Received', 'admin', NULL::uuid),
    ('admin.payments.reports.received', 'he', 'התקבל', 'admin', NULL::uuid),
    ('admin.payments.reports.ofExpected', 'en', 'Of expected', 'admin', NULL::uuid),
    ('admin.payments.reports.ofExpected', 'he', 'מהצפוי', 'admin', NULL::uuid),
    ('admin.payments.reports.remaining', 'en', 'Remaining', 'admin', NULL::uuid),
    ('admin.payments.reports.remaining', 'he', 'נותר', 'admin', NULL::uuid),
    ('admin.payments.reports.cashFlowForecast', 'en', 'Cash Flow Forecast', 'admin', NULL::uuid),
    ('admin.payments.reports.cashFlowForecast', 'he', 'תחזית תזרים מזומנים', 'admin', NULL::uuid),
    ('admin.payments.reports.cashFlowForecastDescription', 'en', 'Projected cash flow for upcoming months', 'admin', NULL::uuid),
    ('admin.payments.reports.cashFlowForecastDescription', 'he', 'תזרים מזומנים צפוי לחודשים הקרובים', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueSourcesBreakdown', 'en', 'Revenue Sources Breakdown', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueSourcesBreakdown', 'he', 'פירוט מקורות הכנסה', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueSourcesDescription', 'en', 'Revenue by source type', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueSourcesDescription', 'he', 'הכנסות לפי סוג מקור', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- PRODUCT PERFORMANCE REPORT
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.revenueByProduct', 'en', 'Revenue by Product', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByProduct', 'he', 'הכנסות לפי מוצר', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByProductDescription', 'en', 'Top products by revenue generation', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByProductDescription', 'he', 'מוצרים מובילים לפי יצירת הכנסות', 'admin', NULL::uuid),
    ('admin.payments.reports.productPerformanceDetails', 'en', 'Product Performance Details', 'admin', NULL::uuid),
    ('admin.payments.reports.productPerformanceDetails', 'he', 'פרטי ביצועי מוצר', 'admin', NULL::uuid),
    ('admin.payments.reports.productPerformanceDescription', 'en', 'Detailed product performance metrics', 'admin', NULL::uuid),
    ('admin.payments.reports.productPerformanceDescription', 'he', 'מדדי ביצוע מוצר מפורטים', 'admin', NULL::uuid),
    ('admin.payments.reports.preferredPlan', 'en', 'Preferred plan', 'admin', NULL::uuid),
    ('admin.payments.reports.preferredPlan', 'he', 'תוכנית מועדפת', 'admin', NULL::uuid),
    ('admin.payments.reports.enrollments', 'en', 'enrollments', 'admin', NULL::uuid),
    ('admin.payments.reports.enrollments', 'he', 'הרשמות', 'admin', NULL::uuid),
    ('admin.payments.reports.paymentCompletionRate', 'en', 'Payment completion rate', 'admin', NULL::uuid),
    ('admin.payments.reports.paymentCompletionRate', 'he', 'שיעור השלמת תשלום', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- USER ANALYSIS REPORT
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.revenueByUserSegment', 'en', 'Revenue by User Segment', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByUserSegment', 'he', 'הכנסות לפי פלח משתמשים', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByUserSegmentDescription', 'en', 'Revenue distribution across user segments', 'admin', NULL::uuid),
    ('admin.payments.reports.revenueByUserSegmentDescription', 'he', 'התפלגות הכנסות בין פלחי משתמשים', 'admin', NULL::uuid),
    ('admin.payments.reports.avg', 'en', 'Avg', 'admin', NULL::uuid),
    ('admin.payments.reports.avg', 'he', 'ממוצע', 'admin', NULL::uuid),
    ('admin.payments.reports.segments.students', 'en', 'Students', 'admin', NULL::uuid),
    ('admin.payments.reports.segments.students', 'he', 'סטודנטים', 'admin', NULL::uuid),
    ('admin.payments.reports.segments.parents', 'en', 'Parents', 'admin', NULL::uuid),
    ('admin.payments.reports.segments.parents', 'he', 'הורים', 'admin', NULL::uuid),
    ('admin.payments.reports.segments.professionals', 'en', 'Professionals', 'admin', NULL::uuid),
    ('admin.payments.reports.segments.professionals', 'he', 'אנשי מקצוע', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- PAYMENT PLANS REPORT
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.planSelectionTrends', 'en', 'Plan Selection Trends', 'admin', NULL::uuid),
    ('admin.payments.reports.planSelectionTrends', 'he', 'מגמות בחירת תוכניות', 'admin', NULL::uuid),
    ('admin.payments.reports.planSelectionTrendsDescription', 'en', 'How users select payment plans over time', 'admin', NULL::uuid),
    ('admin.payments.reports.planSelectionTrendsDescription', 'he', 'כיצד משתמשים בוחרים תוכניות תשלום לאורך זמן', 'admin', NULL::uuid),
    ('admin.payments.reports.planComparison', 'en', 'Plan Comparison', 'admin', NULL::uuid),
    ('admin.payments.reports.planComparison', 'he', 'השוואת תוכניות', 'admin', NULL::uuid),
    ('admin.payments.reports.planComparisonDescription', 'en', 'Side-by-side payment plan comparison', 'admin', NULL::uuid),
    ('admin.payments.reports.planComparisonDescription', 'he', 'השוואת תוכניות תשלום זו לצד זו', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.fullPayment', 'en', 'Full Payment', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.fullPayment', 'he', 'תשלום מלא', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.depositSixMonths', 'en', 'Deposit + 6 Months', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.depositSixMonths', 'he', 'מקדמה + 6 חודשים', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.twelveMonthly', 'en', '12 Monthly Payments', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.twelveMonthly', 'he', '12 תשלומים חודשיים', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.monthlySubscription', 'en', 'Monthly Subscription', 'admin', NULL::uuid),
    ('admin.payments.reports.planNames.monthlySubscription', 'he', 'מנוי חודשי', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- OPERATIONAL REPORT
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.failedPayments', 'en', 'Failed Payments', 'admin', NULL::uuid),
    ('admin.payments.reports.failedPayments', 'he', 'תשלומים כושלים', 'admin', NULL::uuid),
    ('admin.payments.reports.toRetry', 'en', 'To retry', 'admin', NULL::uuid),
    ('admin.payments.reports.toRetry', 'he', 'לנסות שוב', 'admin', NULL::uuid),
    ('admin.payments.reports.pausedSchedules', 'en', 'Paused Schedules', 'admin', NULL::uuid),
    ('admin.payments.reports.pausedSchedules', 'he', 'לוחות זמנים מושהים', 'admin', NULL::uuid),
    ('admin.payments.reports.temporarilyOnHold', 'en', 'Temporarily on hold', 'admin', NULL::uuid),
    ('admin.payments.reports.temporarilyOnHold', 'he', 'מושהה זמנית', 'admin', NULL::uuid),
    ('admin.payments.reports.endingSoon', 'en', 'Ending Soon', 'admin', NULL::uuid),
    ('admin.payments.reports.endingSoon', 'he', 'מסתיים בקרוב', 'admin', NULL::uuid),
    ('admin.payments.reports.subscriptionsThisMonth', 'en', 'Subscriptions this month', 'admin', NULL::uuid),
    ('admin.payments.reports.subscriptionsThisMonth', 'he', 'מנויים החודש', 'admin', NULL::uuid),
    ('admin.payments.reports.requiresAction', 'en', 'Requires action', 'admin', NULL::uuid),
    ('admin.payments.reports.requiresAction', 'he', 'דורש פעולה', 'admin', NULL::uuid),
    ('admin.payments.reports.recentAdminActions', 'en', 'Recent Admin Actions', 'admin', NULL::uuid),
    ('admin.payments.reports.recentAdminActions', 'he', 'פעולות אדמין אחרונות', 'admin', NULL::uuid),
    ('admin.payments.reports.recentAdminActionsDescription', 'en', 'Recent administrative actions on payments', 'admin', NULL::uuid),
    ('admin.payments.reports.recentAdminActionsDescription', 'he', 'פעולות ניהוליות אחרונות על תשלומים', 'admin', NULL::uuid),
    ('admin.payments.reports.systemHealth', 'en', 'System Health', 'admin', NULL::uuid),
    ('admin.payments.reports.systemHealth', 'he', 'תקינות מערכת', 'admin', NULL::uuid),
    ('admin.payments.reports.systemHealthDescription', 'en', 'Payment system health metrics', 'admin', NULL::uuid),
    ('admin.payments.reports.systemHealthDescription', 'he', 'מדדי תקינות מערכת תשלומים', 'admin', NULL::uuid),
    ('admin.payments.reports.webhookSuccessRate', 'en', 'Webhook Success Rate', 'admin', NULL::uuid),
    ('admin.payments.reports.webhookSuccessRate', 'he', 'שיעור הצלחת Webhook', 'admin', NULL::uuid),
    ('admin.payments.reports.avgProcessingTime', 'en', 'Avg Processing Time', 'admin', NULL::uuid),
    ('admin.payments.reports.avgProcessingTime', 'he', 'זמן עיבוד ממוצע', 'admin', NULL::uuid),
    ('admin.payments.reports.failedWebhooks', 'en', 'Failed Webhooks', 'admin', NULL::uuid),
    ('admin.payments.reports.failedWebhooks', 'he', 'Webhooks כושלים', 'admin', NULL::uuid),
    ('admin.payments.reports.lastReconciliation', 'en', 'Last Reconciliation', 'admin', NULL::uuid),
    ('admin.payments.reports.lastReconciliation', 'he', 'התאמה אחרונה', 'admin', NULL::uuid),
    ('admin.payments.reports.hoursAgo', 'en', 'hours ago', 'admin', NULL::uuid),
    ('admin.payments.reports.hoursAgo', 'he', 'שעות קודם', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- CHART LABELS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.reports.charts.revenue', 'en', 'Revenue', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.revenue', 'he', 'הכנסות', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.newMrr', 'en', 'New MRR', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.newMrr', 'he', 'MRR חדש', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.expansion', 'en', 'Expansion', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.expansion', 'he', 'הרחבה', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.churn', 'en', 'Churn', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.churn', 'he', 'נשירה', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.payments', 'en', 'Payments', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.payments', 'he', 'תשלומים', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.expectedRevenue', 'en', 'Expected Revenue', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.expectedRevenue', 'he', 'הכנסות צפויות', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.scheduledPayments', 'en', 'Scheduled Payments', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.scheduledPayments', 'he', 'תשלומים מתוכננים', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.subscriptionRevenue', 'en', 'Subscription Revenue', 'admin', NULL::uuid),
    ('admin.payments.reports.charts.subscriptionRevenue', 'he', 'הכנסות ממנויים', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  RAISE NOTICE 'Payment Reports page translations migration completed successfully - added translations';
END $$;
