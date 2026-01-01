import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Page Header
  { key: 'admin.payments.reports.title', en: 'Payment Reports', he: 'דוחות תשלומים' },
  { key: 'admin.payments.reports.description', en: 'Comprehensive payment analytics and insights', he: 'ניתוחים ותובנות מקיפים על תשלומים' },
  { key: 'admin.payments.reports.export', en: 'Export', he: 'ייצוא' },

  // Date Range Options
  { key: 'admin.payments.reports.today', en: 'Today', he: 'היום' },
  { key: 'admin.payments.reports.last7Days', en: 'Last 7 Days', he: '7 ימים אחרונים' },
  { key: 'admin.payments.reports.last30Days', en: 'Last 30 Days', he: '30 ימים אחרונים' },
  { key: 'admin.payments.reports.last90Days', en: 'Last 90 Days', he: '90 ימים אחרונים' },
  { key: 'admin.payments.reports.thisYear', en: 'This Year', he: 'השנה' },
  { key: 'admin.payments.reports.customRange', en: 'Custom Range', he: 'טווח מותאם' },

  // Tab Names
  { key: 'admin.payments.reports.tabs.revenue', en: 'Revenue', he: 'הכנסות' },
  { key: 'admin.payments.reports.tabs.status', en: 'Status', he: 'סטטוס' },
  { key: 'admin.payments.reports.tabs.cashflow', en: 'Cash Flow', he: 'תזרים מזומנים' },
  { key: 'admin.payments.reports.tabs.products', en: 'Products', he: 'מוצרים' },
  { key: 'admin.payments.reports.tabs.users', en: 'Users', he: 'משתמשים' },
  { key: 'admin.payments.reports.tabs.plans', en: 'Plans', he: 'תוכניות' },
  { key: 'admin.payments.reports.tabs.operational', en: 'Operational', he: 'תפעולי' },

  // Status Report
  { key: 'admin.payments.reports.statusDistribution', en: 'Status Distribution', he: 'התפלגות סטטוס' },
  { key: 'admin.payments.reports.statusDistributionDescription', en: 'Payment status breakdown', he: 'פירוט סטטוס תשלומים' },
  { key: 'admin.payments.reports.completionRate', en: 'Completion Rate', he: 'שיעור השלמה' },
  { key: 'admin.payments.reports.completionRateDescription', en: 'Payment completion analysis', he: 'ניתוח השלמת תשלומים' },
  { key: 'admin.payments.reports.onTime', en: 'On Time', he: 'בזמן' },
  { key: 'admin.payments.reports.late', en: 'Late', he: 'באיחור' },
  { key: 'admin.payments.reports.default', en: 'Default', he: 'כשלון' },
  { key: 'admin.payments.reports.statusTrend', en: 'Payment Status Trend', he: 'מגמת סטטוס תשלומים' },
  { key: 'admin.payments.reports.statusTrendDescription', en: 'Payment status distribution over the last 6 months', he: 'התפלגות סטטוס תשלומים ב-6 חודשים אחרונים' },

  // Cash Flow Report
  { key: 'admin.payments.reports.expectedThisMonth', en: 'Expected This Month', he: 'צפוי החודש' },
  { key: 'admin.payments.reports.fromAllSources', en: 'From all sources', he: 'מכל המקורות' },
  { key: 'admin.payments.reports.received', en: 'Received', he: 'התקבל' },
  { key: 'admin.payments.reports.ofExpected', en: 'Of expected', he: 'מהצפוי' },
  { key: 'admin.payments.reports.pending', en: 'Pending', he: 'ממתין' },
  { key: 'admin.payments.reports.remaining', en: 'Remaining', he: 'נותר' },
  { key: 'admin.payments.reports.cashFlowForecast', en: 'Cash Flow Forecast', he: 'תחזית תזרים מזומנים' },
  { key: 'admin.payments.reports.cashFlowForecastDescription', en: 'Projected cash flow for upcoming months', he: 'תזרים מזומנים צפוי לחודשים הקרובים' },
  { key: 'admin.payments.reports.revenueSourcesBreakdown', en: 'Revenue Sources Breakdown', he: 'פירוט מקורות הכנסה' },
  { key: 'admin.payments.reports.revenueSourcesDescription', en: 'Revenue by source type', he: 'הכנסות לפי סוג מקור' },

  // Product Report
  { key: 'admin.payments.reports.revenueByProduct', en: 'Revenue by Product', he: 'הכנסות לפי מוצר' },
  { key: 'admin.payments.reports.revenueByProductDescription', en: 'Top products by revenue generation', he: 'מוצרים מובילים לפי יצירת הכנסות' },
  { key: 'admin.payments.reports.productPerformanceDetails', en: 'Product Performance Details', he: 'פרטי ביצועי מוצר' },
  { key: 'admin.payments.reports.productPerformanceDescription', en: 'Detailed product performance metrics', he: 'מדדי ביצועי מוצר מפורטים' },
  { key: 'admin.payments.reports.preferredPlan', en: 'Preferred plan', he: 'תוכנית מועדפת' },
  { key: 'admin.payments.reports.enrollments', en: 'enrollments', he: 'הרשמות' },
  { key: 'admin.payments.reports.paymentCompletionRate', en: 'Payment completion rate', he: 'שיעור השלמת תשלום' },

  // User Segments Report
  { key: 'admin.payments.reports.segments.students', en: 'Students', he: 'תלמידים' },
  { key: 'admin.payments.reports.segments.parents', en: 'Parents', he: 'הורים' },
  { key: 'admin.payments.reports.segments.professionals', en: 'Professionals', he: 'מקצוענים' },
  { key: 'admin.payments.reports.avg', en: 'Avg', he: 'ממוצע' },
  { key: 'admin.payments.reports.revenueByUserSegment', en: 'Revenue by User Segment', he: 'הכנסות לפי פלח משתמשים' },
  { key: 'admin.payments.reports.revenueByUserSegmentDescription', en: 'Revenue distribution across user segments', he: 'התפלגות הכנסות בין פלחי משתמשים' },

  // Payment Plans Report
  { key: 'admin.payments.reports.planNames.fullPayment', en: 'Full Payment', he: 'תשלום מלא' },
  { key: 'admin.payments.reports.planNames.depositSixMonths', en: 'Deposit + 6 Months', he: 'מקדמה + 6 חודשים' },
  { key: 'admin.payments.reports.planNames.twelveMonthly', en: '12 Monthly Payments', he: '12 תשלומים חודשיים' },
  { key: 'admin.payments.reports.planNames.monthlySubscription', en: 'Monthly Subscription', he: 'מנוי חודשי' },
  { key: 'admin.payments.reports.planSelectionTrends', en: 'Plan Selection Trends', he: 'מגמות בחירת תוכניות' },
  { key: 'admin.payments.reports.planSelectionTrendsDescription', en: 'How users select payment plans over time', he: 'כיצד משתמשים בוחרים תוכניות תשלום לאורך זמן' },
  { key: 'admin.payments.reports.planComparison', en: 'Plan Comparison', he: 'השוואת תוכניות' },
  { key: 'admin.payments.reports.planComparisonDescription', en: 'Side-by-side payment plan comparison', he: 'השוואה זה לצד זה של תוכניות תשלום' },

  // Operational Report
  { key: 'admin.payments.reports.overduePayments', en: 'Overdue Payments', he: 'תשלומים באיחור' },
  { key: 'admin.payments.reports.requiresAction', en: 'Requires action', he: 'דורש פעולה' },
  { key: 'admin.payments.reports.failedPayments', en: 'Failed Payments', he: 'תשלומים שנכשלו' },
  { key: 'admin.payments.reports.toRetry', en: 'To retry', he: 'לנסות שוב' },
  { key: 'admin.payments.reports.pausedSchedules', en: 'Paused Schedules', he: 'לוחות זמנים מושהים' },
  { key: 'admin.payments.reports.temporarilyOnHold', en: 'Temporarily on hold', he: 'בהמתנה זמנית' },
  { key: 'admin.payments.reports.endingSoon', en: 'Ending Soon', he: 'מסתיים בקרוב' },
  { key: 'admin.payments.reports.subscriptionsThisMonth', en: 'Subscriptions this month', he: 'מנויים החודש' },
  { key: 'admin.payments.reports.recentAdminActions', en: 'Recent Admin Actions', he: 'פעולות אדמין אחרונות' },
  { key: 'admin.payments.reports.recentAdminActionsDescription', en: 'Recent administrative actions on payments', he: 'פעולות ניהוליות אחרונות על תשלומים' },
  { key: 'admin.payments.reports.systemHealth', en: 'System Health', he: 'תקינות המערכת' },
  { key: 'admin.payments.reports.systemHealthDescription', en: 'Payment system health metrics', he: 'מדדי תקינות מערכת תשלומים' },
  { key: 'admin.payments.reports.webhookSuccessRate', en: 'Webhook Success Rate', he: 'שיעור הצלחת Webhook' },
  { key: 'admin.payments.reports.avgProcessingTime', en: 'Avg Processing Time', he: 'זמן עיבוד ממוצע' },
  { key: 'admin.payments.reports.failedWebhooks', en: 'Failed Webhooks', he: 'Webhooks שנכשלו' },
  { key: 'admin.payments.reports.lastReconciliation', en: 'Last Reconciliation', he: 'התאמה אחרונה' },
  { key: 'admin.payments.reports.hoursAgo', en: 'hours ago', he: 'שעות' },

  // Chart Labels
  { key: 'admin.payments.reports.charts.payments', en: 'Payments', he: 'תשלומים' },
  { key: 'admin.payments.reports.charts.expectedRevenue', en: 'Expected Revenue', he: 'הכנסה צפויה' },
  { key: 'admin.payments.reports.charts.scheduledPayments', en: 'Scheduled Payments', he: 'תשלומים מתוכננים' },
  { key: 'admin.payments.reports.charts.subscriptionRevenue', en: 'Subscription Revenue', he: 'הכנסה ממנויים' },

  // Common
  { key: 'common.complete', en: 'complete', he: 'הושלם' },
];

async function addTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;
    let addedCount = 0;
    let updatedCount = 0;

    console.log(`\n📝 Adding/updating ${translations.length} report translations for tenant: ${tenantId}\n`);

    for (const { key, en, he } of translations) {
      // Check Hebrew translation
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .single();

      if (existingHe) {
        if (existingHe.translation_value !== he) {
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: he })
            .eq('id', existingHe.id);

          if (!updateError) {
            updatedCount++;
            console.log(`🔄 Updated HE: ${key}`);
          }
        } else {
          console.log(`✓ Exists HE: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: he,
            language_code: 'he',
            context: 'admin'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added HE: ${key}`);
        }
      }

      // Check English translation
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id, translation_value')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .single();

      if (existingEn) {
        if (existingEn.translation_value !== en) {
          const { error: updateError } = await supabase
            .from('translations')
            .update({ translation_value: en })
            .eq('id', existingEn.id);

          if (!updateError) {
            updatedCount++;
            console.log(`🔄 Updated EN: ${key}`);
          }
        } else {
          console.log(`✓ Exists EN: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: en,
            language_code: 'en',
            context: 'admin'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added EN: ${key}`);
        }
      }
    }

    console.log(`\n✅ Completed!`);
    console.log(`Total added: ${addedCount}`);
    console.log(`Total updated: ${updatedCount}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

addTranslations();
