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
  // Revenue Report - Summary Cards
  { key: 'admin.payments.totalRevenue', en: 'Total Revenue', he: 'סה"כ הכנסות' },
  { key: 'admin.payments.reports.totalExpectedIncome', en: 'Total Expected Income', he: 'סה"כ הכנסה צפויה' },
  { key: 'admin.payments.mrr', en: 'MRR', he: 'הכנסה חודשית חוזרת' },
  { key: 'admin.payments.arr', en: 'ARR', he: 'הכנסה שנתית חוזרת' },

  // Revenue Report - Descriptions
  { key: 'admin.payments.reports.avgTransaction', en: 'Avg Transaction', he: 'ממוצע עסקה' },
  { key: 'admin.payments.reports.monthlyRecurring', en: 'Monthly Recurring', he: 'חודשי חוזר' },
  { key: 'admin.payments.reports.arrDescription', en: 'Annual Recurring Revenue', he: 'הכנסה שנתית חוזרת' },
  { key: 'admin.payments.reports.allSchedules', en: 'All Schedules', he: 'כל התשלומים' },

  // Revenue Report - Charts
  { key: 'admin.payments.reports.revenueTrend', en: 'Revenue Trend', he: 'מגמת הכנסות' },
  { key: 'admin.payments.reports.revenueTrendDescription', en: 'Revenue performance over time', he: 'ביצועי הכנסות לאורך זמן' },
  { key: 'admin.payments.reports.transactions', en: 'transactions', he: 'עסקאות' },
  { key: 'admin.payments.reports.charts.revenue', en: 'Revenue', he: 'הכנסות' },
  { key: 'admin.payments.reports.revenueByType', en: 'Revenue by Type', he: 'הכנסות לפי סוג' },
  { key: 'admin.payments.reports.revenueByTypeDescription', en: 'Revenue breakdown by payment type', he: 'פירוט הכנסות לפי סוג תשלום' },
  { key: 'admin.payments.reports.revenueDistribution', en: 'Revenue Distribution', he: 'התפלגות הכנסות' },
  { key: 'admin.payments.reports.revenueDistributionDescription', en: 'Detailed revenue distribution breakdown', he: 'פירוט מפורט של התפלגות הכנסות' },
  { key: 'admin.payments.reports.noData', en: 'No data available for this period', he: 'אין נתונים זמינים לתקופה זו' },

  // Date Range Options
  { key: 'admin.payments.reports.dateRange.today', en: 'Today', he: 'היום' },
  { key: 'admin.payments.reports.dateRange.last7Days', en: 'Last 7 Days', he: '7 ימים אחרונים' },
  { key: 'admin.payments.reports.dateRange.last30Days', en: 'Last 30 Days', he: '30 ימים אחרונים' },
  { key: 'admin.payments.reports.dateRange.last90Days', en: 'Last 90 Days', he: '90 ימים אחרונים' },
  { key: 'admin.payments.reports.dateRange.thisYear', en: 'This Year', he: 'השנה' },
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

    console.log(`\n📝 Adding/updating ${translations.length} revenue report translations for tenant: ${tenantId}\n`);

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
