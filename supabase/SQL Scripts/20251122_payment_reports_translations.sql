-- ============================================================================
-- Payment Reports Page Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for payment reports page
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
      -- Common translations
      'common.total',
      'common.complete',
      -- Month abbreviations
      'common.months.jan',
      'common.months.feb',
      'common.months.mar',
      'common.months.apr',
      'common.months.may',
      'common.months.jun',
      'common.months.jul',
      'common.months.aug',
      'common.months.sep',
      'common.months.oct',
      'common.months.nov',
      'common.months.dec',
      -- Day ranges
      'common.dayRanges.0-7',
      'common.dayRanges.8-30',
      'common.dayRanges.31-60',
      'common.dayRanges.60plus',
      -- Page header
      'admin.payments.reports.title',
      'admin.payments.reports.description',
      'admin.payments.reports.export',
      -- Date range filters
      'admin.payments.reports.today',
      'admin.payments.reports.last7Days',
      'admin.payments.reports.last30Days',
      'admin.payments.reports.last90Days',
      'admin.payments.reports.thisYear',
      'admin.payments.reports.customRange',
      -- Tab titles
      'admin.payments.reports.tabs.revenue',
      'admin.payments.reports.tabs.status',
      'admin.payments.reports.tabs.cashflow',
      'admin.payments.reports.tabs.products',
      'admin.payments.reports.tabs.users',
      'admin.payments.reports.tabs.plans',
      'admin.payments.reports.tabs.operational',
      -- Revenue metrics
      'admin.payments.totalRevenue',
      'admin.payments.reports.avgTransaction',
      'admin.payments.mrr',
      'admin.payments.arr',
      'admin.payments.reports.arrDescription',
      -- Revenue charts
      'admin.payments.reports.revenueTrend',
      'admin.payments.reports.revenueTrendDescription',
      'admin.payments.reports.revenueByType',
      'admin.payments.reports.revenueByTypeDescription',
      'admin.payments.reports.revenueDistribution',
      'admin.payments.reports.revenueDistributionDescription',
      'admin.payments.reports.mrrGrowth',
      'admin.payments.reports.mrrGrowthDescription',
      -- Payment plans types
      'admin.payments.plans.types.oneTime',
      'admin.payments.plans.types.deposit',
      'admin.payments.plans.types.installments',
      'admin.payments.plans.types.subscription',
      -- Payment status report
      'admin.payments.schedules.statuses.paid',
      'admin.payments.schedules.statuses.partial',
      'admin.payments.schedules.statuses.pending',
      'admin.payments.schedules.statuses.overdue',
      -- Status report translations (NEW)
      'admin.payments.reports.statusDistribution',
      'admin.payments.reports.statusDistributionDescription',
      'admin.payments.reports.completionRate',
      'admin.payments.reports.completionRateDescription',
      'admin.payments.reports.onTime',
      'admin.payments.reports.late',
      'admin.payments.reports.default',
      'admin.payments.reports.overdueAging',
      'admin.payments.reports.overdueAgingDescription',
      'admin.payments.reports.overduePayments',
      'admin.payments.reports.overduePaymentsDescription',
      'admin.payments.reports.daysOverdue',
      -- Cash flow report translations (NEW)
      'admin.payments.reports.expectedThisMonth',
      'admin.payments.reports.fromAllSources',
      'admin.payments.reports.received',
      'admin.payments.reports.ofExpected',
      'admin.payments.reports.remaining',
      'admin.payments.reports.cashFlowForecast',
      'admin.payments.reports.cashFlowForecastDescription',
      'admin.payments.reports.revenueSourcesBreakdown',
      'admin.payments.reports.revenueSourcesDescription',
      -- Product performance translations (NEW)
      'admin.payments.reports.revenueByProduct',
      'admin.payments.reports.revenueByProductDescription',
      'admin.payments.reports.productPerformanceDetails',
      'admin.payments.reports.productPerformanceDescription',
      'admin.payments.reports.preferredPlan',
      'admin.payments.reports.enrollments',
      'admin.payments.reports.paymentCompletionRate',
      -- User analysis translations (NEW)
      'admin.payments.reports.revenueByUserSegment',
      'admin.payments.reports.revenueByUserSegmentDescription',
      -- Payment plans analysis translations (NEW)
      'admin.payments.reports.planSelectionTrends',
      'admin.payments.reports.planSelectionTrendsDescription',
      'admin.payments.reports.planComparison',
      'admin.payments.reports.planComparisonDescription',
      'admin.payments.reports.avg',
      -- Operational report translations (NEW)
      'admin.payments.reports.failedPayments',
      'admin.payments.reports.requiresAction',
      'admin.payments.reports.toRetry',
      'admin.payments.reports.pausedSchedules',
      'admin.payments.reports.temporarilyOnHold',
      'admin.payments.reports.endingSoon',
      'admin.payments.reports.subscriptionsThisMonth',
      'admin.payments.reports.recentAdminActions',
      'admin.payments.reports.recentAdminActionsDescription',
      'admin.payments.reports.systemHealth',
      'admin.payments.reports.systemHealthDescription',
      'admin.payments.reports.webhookSuccessRate',
      'admin.payments.reports.avgProcessingTime',
      'admin.payments.reports.failedWebhooks',
      'admin.payments.reports.lastReconciliation',
      'admin.payments.reports.hoursAgo',
      -- Chart legend translations (NEW)
      'admin.payments.reports.charts.revenue',
      'admin.payments.reports.charts.newMrr',
      'admin.payments.reports.charts.expansion',
      'admin.payments.reports.charts.churn',
      'admin.payments.reports.charts.payments',
      'admin.payments.reports.charts.expectedRevenue',
      'admin.payments.reports.charts.scheduledPayments',
      'admin.payments.reports.charts.subscriptionRevenue',
      -- User segment translations (NEW)
      'admin.payments.reports.segments.students',
      'admin.payments.reports.segments.parents',
      'admin.payments.reports.segments.professionals',
      -- Payment plan name translations (NEW)
      'admin.payments.reports.planNames.fullPayment',
      'admin.payments.reports.planNames.depositSixMonths',
      'admin.payments.reports.planNames.twelveMonthly',
      'admin.payments.reports.planNames.monthlySubscription'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Common translations
  (v_tenant_id, 'en', 'common.total', 'total', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.total', 'סה"כ', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.complete', 'complete', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.complete', 'הושלם', 'admin', NOW(), NOW()),

  -- Month abbreviations
  (v_tenant_id, 'en', 'common.months.jan', 'Jan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.jan', 'ינו׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.feb', 'Feb', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.feb', 'פבר׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.mar', 'Mar', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.mar', 'מרץ', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.apr', 'Apr', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.apr', 'אפר׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.may', 'May', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.may', 'מאי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.jun', 'Jun', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.jun', 'יוני', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.jul', 'Jul', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.jul', 'יולי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.aug', 'Aug', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.aug', 'אוג׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.sep', 'Sep', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.sep', 'ספט׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.oct', 'Oct', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.oct', 'אוק׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.nov', 'Nov', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.nov', 'נוב׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.months.dec', 'Dec', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.months.dec', 'דצמ׳', 'admin', NOW(), NOW()),

  -- Day ranges
  (v_tenant_id, 'en', 'common.dayRanges.0-7', '0-7 days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.dayRanges.0-7', '0-7 ימים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.dayRanges.8-30', '8-30 days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.dayRanges.8-30', '8-30 ימים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.dayRanges.31-60', '31-60 days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.dayRanges.31-60', '31-60 ימים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.dayRanges.60plus', '60+ days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.dayRanges.60plus', '60+ ימים', 'admin', NOW(), NOW()),

  -- Page header
  (v_tenant_id, 'en', 'admin.payments.reports.title', 'Payment Reports & Analytics', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.title', 'דוחות וניתוח תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.description', 'Comprehensive payment analytics and insights', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.description', 'ניתוח ותובנות תשלומים מקיפות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.export', 'Export', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.export', 'ייצוא', 'admin', NOW(), NOW()),

  -- Date range filters
  (v_tenant_id, 'en', 'admin.payments.reports.today', 'Today', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.today', 'היום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.last7Days', 'Last 7 Days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last7Days', '7 ימים אחרונים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.last30Days', 'Last 30 Days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last30Days', '30 ימים אחרונים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.last90Days', 'Last 90 Days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.last90Days', '90 ימים אחרונים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.thisYear', 'This Year', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.thisYear', 'השנה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.customRange', 'Custom Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.customRange', 'טווח מותאם', 'admin', NOW(), NOW()),

  -- Tab titles
  (v_tenant_id, 'en', 'admin.payments.reports.tabs.revenue', 'Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.revenue', 'הכנסות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.tabs.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.status', 'סטטוס', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.tabs.cashflow', 'Cash Flow', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.cashflow', 'תזרים מזומנים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.tabs.products', 'Products', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.products', 'מוצרים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.tabs.users', 'Users', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.users', 'משתמשים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.tabs.plans', 'Plans', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.plans', 'תוכניות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.tabs.operational', 'Operational', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.tabs.operational', 'תפעולי', 'admin', NOW(), NOW()),

  -- Revenue metrics
  (v_tenant_id, 'en', 'admin.payments.totalRevenue', 'Total Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.totalRevenue', 'סך ההכנסות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.avgTransaction', 'Avg Transaction', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.avgTransaction', 'ממוצע עסקה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.mrr', 'MRR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.mrr', 'הכנסה חודשית חוזרת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.arr', 'ARR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.arr', 'הכנסה שנתית חוזרת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.arrDescription', 'Annual recurring revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.arrDescription', 'הכנסה שנתית חוזרת', 'admin', NOW(), NOW()),

  -- Revenue charts
  (v_tenant_id, 'en', 'admin.payments.reports.revenueTrend', 'Revenue Trend', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueTrend', 'מגמת הכנסות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueTrendDescription', 'Revenue and transactions over time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueTrendDescription', 'הכנסות ועסקאות לאורך זמן', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueByType', 'Revenue by Payment Type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByType', 'הכנסות לפי סוג תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueByTypeDescription', 'Distribution across payment methods', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByTypeDescription', 'התפלגות בין שיטות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueDistribution', 'Revenue Distribution', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueDistribution', 'התפלגות הכנסות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueDistributionDescription', 'Breakdown by payment type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueDistributionDescription', 'פירוט לפי סוג תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.mrrGrowth', 'MRR Growth', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.mrrGrowth', 'צמיחת הכנסה חודשית', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.mrrGrowthDescription', 'Monthly recurring revenue breakdown', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.mrrGrowthDescription', 'פירוט הכנסה חודשית חוזרת', 'admin', NOW(), NOW()),

  -- Payment plans types
  (v_tenant_id, 'en', 'admin.payments.plans.types.oneTime', 'One-Time Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.oneTime', 'תשלום חד פעמי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.plans.types.deposit', 'Deposit + Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.deposit', 'מקדמה + תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.plans.types.installments', 'Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.installments', 'תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.plans.types.subscription', 'Subscription', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.plans.types.subscription', 'מנוי', 'admin', NOW(), NOW()),

  -- Payment status
  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.paid', 'Paid', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.paid', 'שולם', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.partial', 'Partial', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.partial', 'חלקי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.pending', 'Pending', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.pending', 'ממתין', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.statuses.overdue', 'Overdue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.statuses.overdue', 'באיחור', 'admin', NOW(), NOW()),

  -- Status report translations
  (v_tenant_id, 'en', 'admin.payments.reports.statusDistribution', 'Payment Status Distribution', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.statusDistribution', 'התפלגות סטטוס תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.statusDistributionDescription', 'By enrollment count', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.statusDistributionDescription', 'לפי מספר הרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.completionRate', 'Payment Completion Rate', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.completionRate', 'אחוז השלמת תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.completionRateDescription', 'Overall payment health', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.completionRateDescription', 'מצב תשלומים כללי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.onTime', 'On-Time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.onTime', 'בזמן', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.late', 'Late', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.late', 'באיחור', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.default', 'Default', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.default', 'ברירת מחדל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.overdueAging', 'Overdue Payment Aging', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.overdueAging', 'חלוקה לפי זמן איחור בתשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.overdueAgingDescription', 'Days overdue distribution', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.overdueAgingDescription', 'התפלגות לפי ימי איחור', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.overduePayments', 'Overdue Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.overduePayments', 'תשלומים באיחור', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.overduePaymentsDescription', 'Payments requiring attention', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.overduePaymentsDescription', 'תשלומים הדורשים טיפול', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.daysOverdue', 'days overdue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.daysOverdue', 'ימים באיחור', 'admin', NOW(), NOW()),

  -- Cash flow report translations
  (v_tenant_id, 'en', 'admin.payments.reports.expectedThisMonth', 'Expected This Month', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.expectedThisMonth', 'צפוי החודש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.fromAllSources', 'From all sources', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.fromAllSources', 'מכל המקורות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.received', 'Received', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.received', 'התקבל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.ofExpected', '72% of expected', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.ofExpected', '72% מהצפוי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.remaining', '28% remaining', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.remaining', '28% נותרו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.cashFlowForecast', '6-Month Cash Flow Forecast', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.cashFlowForecast', 'תחזית תזרים מזומנים ל-6 חודשים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.cashFlowForecastDescription', 'Expected revenue projections', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.cashFlowForecastDescription', 'תחזיות הכנסות צפויות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueSourcesBreakdown', 'Revenue Sources Breakdown', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueSourcesBreakdown', 'פירוט מקורות הכנסה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueSourcesDescription', 'Scheduled vs subscription revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueSourcesDescription', 'הכנסות מתוכננות מול הכנסות מנויים', 'admin', NOW(), NOW()),

  -- Product performance translations
  (v_tenant_id, 'en', 'admin.payments.reports.revenueByProduct', 'Revenue by Product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByProduct', 'הכנסות לפי מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueByProductDescription', 'Top performing courses and programs', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByProductDescription', 'קורסים ותוכניות בעלי ביצועים מובילים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.productPerformanceDetails', 'Product Performance Details', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.productPerformanceDetails', 'פרטי ביצועי מוצרים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.productPerformanceDescription', 'Complete breakdown by product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.productPerformanceDescription', 'פירוט מלא לפי מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.preferredPlan', 'Preferred Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.preferredPlan', 'תוכנית מועדפת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.enrollments', 'enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.enrollments', 'הרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.paymentCompletionRate', 'Payment Completion Rate', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.paymentCompletionRate', 'אחוז השלמת תשלומים', 'admin', NOW(), NOW()),

  -- User analysis translations
  (v_tenant_id, 'en', 'admin.payments.reports.revenueByUserSegment', 'Revenue by User Segment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByUserSegment', 'הכנסות לפי פלח משתמשים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.revenueByUserSegmentDescription', 'Distribution across user types', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.revenueByUserSegmentDescription', 'התפלגות בין סוגי משתמשים', 'admin', NOW(), NOW()),

  -- Payment plans analysis translations
  (v_tenant_id, 'en', 'admin.payments.reports.planSelectionTrends', 'Payment Plan Selection Trends', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planSelectionTrends', 'מגמות בחירת תוכניות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.planSelectionTrendsDescription', 'How users choose payment plans over time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planSelectionTrendsDescription', 'איך משתמשים בוחרים תוכניות תשלום לאורך זמן', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.planComparison', 'Payment Plan Comparison', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planComparison', 'השוואת תוכניות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.planComparisonDescription', 'Revenue and completion rates by plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planComparisonDescription', 'הכנסות ואחוזי השלמה לפי תוכנית', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.avg', 'Avg', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.avg', 'ממוצע', 'admin', NOW(), NOW()),

  -- Operational report translations
  (v_tenant_id, 'en', 'admin.payments.reports.failedPayments', 'Failed Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.failedPayments', 'תשלומים כושלים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.requiresAction', 'Requires action', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.requiresAction', 'דורש טיפול', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.toRetry', 'To retry', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.toRetry', 'לנסות שוב', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.pausedSchedules', 'Paused Schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.pausedSchedules', 'לוחות זמנים מושהים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.temporarilyOnHold', 'Temporarily on hold', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.temporarilyOnHold', 'מושהה זמנית', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.endingSoon', 'Ending Soon', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.endingSoon', 'מסתיימים בקרוב', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.subscriptionsThisMonth', 'Subscriptions this month', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.subscriptionsThisMonth', 'מנויים החודש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.recentAdminActions', 'Recent Admin Actions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.recentAdminActions', 'פעולות אדמין אחרונות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.recentAdminActionsDescription', 'Last 7 days of schedule adjustments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.recentAdminActionsDescription', '7 ימים אחרונים של התאמות לוח זמנים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.systemHealth', 'System Health', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.systemHealth', 'תקינות המערכת', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.systemHealthDescription', 'Payment system status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.systemHealthDescription', 'מצב מערכת התשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.webhookSuccessRate', 'Webhook Success Rate', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.webhookSuccessRate', 'אחוז הצלחת Webhook', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.avgProcessingTime', 'Avg Processing Time', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.avgProcessingTime', 'זמן עיבוד ממוצע', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.failedWebhooks', 'Failed Webhooks', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.failedWebhooks', 'Webhooks כושלים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.lastReconciliation', 'Last Reconciliation', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.lastReconciliation', 'התאמה אחרונה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.hoursAgo', 'hours ago', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.hoursAgo', 'שעות', 'admin', NOW(), NOW()),

  -- Chart legend translations
  (v_tenant_id, 'en', 'admin.payments.reports.charts.revenue', 'Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.revenue', 'הכנסות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.charts.newMrr', 'New MRR', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.newMrr', 'הכנסה חודשית חדשה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.charts.expansion', 'Expansion', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.expansion', 'הרחבה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.charts.churn', 'Churn', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.churn', 'עזיבה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.charts.payments', 'Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.payments', 'תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.charts.expectedRevenue', 'Expected Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.expectedRevenue', 'הכנסות צפויות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.charts.scheduledPayments', 'Scheduled Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.scheduledPayments', 'תשלומים מתוכננים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.charts.subscriptionRevenue', 'Subscription Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.charts.subscriptionRevenue', 'הכנסות ממנויים', 'admin', NOW(), NOW()),

  -- User segment translations
  (v_tenant_id, 'en', 'admin.payments.reports.segments.students', 'Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.segments.students', 'סטודנטים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.segments.parents', 'Parents', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.segments.parents', 'הורים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.segments.professionals', 'Professionals', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.segments.professionals', 'אנשי מקצוע', 'admin', NOW(), NOW()),

  -- Payment plan name translations
  (v_tenant_id, 'en', 'admin.payments.reports.planNames.fullPayment', 'Full Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planNames.fullPayment', 'תשלום מלא', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.planNames.depositSixMonths', '30% Deposit + 6 Months', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planNames.depositSixMonths', '30% מקדמה + 6 חודשים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.planNames.twelveMonthly', '12 Monthly Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planNames.twelveMonthly', '12 תשלומים חודשיים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.reports.planNames.monthlySubscription', 'Monthly Subscription', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.reports.planNames.monthlySubscription', 'מנוי חודשי', 'admin', NOW(), NOW());

  RAISE NOTICE 'Payment reports translations added successfully';

END $$;
