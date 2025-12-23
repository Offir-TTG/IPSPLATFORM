const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const translations = [
  // Billing Tab - General
  { key: 'user.profile.billing.loading', en: 'Loading billing data...', he: 'טוען נתוני חיוב...' },
  { key: 'user.profile.billing.errorLoading', en: 'Failed to load enrollment data', he: 'נכשל בטעינת נתוני ההרשמה' },

  // Empty State
  { key: 'user.profile.billing.noEnrollments', en: 'No Enrollments Yet', he: 'אין הרשמות עדיין' },
  { key: 'user.profile.billing.noEnrollmentsDesc', en: "You haven't enrolled in any programs yet.", he: 'עדיין לא נרשמת לתוכניות.' },
  { key: 'user.profile.billing.browseCourses', en: 'Browse Courses', he: 'עיין בקורסים' },

  // Summary Stats
  { key: 'user.profile.billing.totalSpent', en: 'Total Spent', he: 'סה"כ שולם' },
  { key: 'user.profile.billing.outstanding', en: 'Outstanding', he: 'יתרה לתשלום' },
  { key: 'user.profile.billing.activeEnrollments', en: 'Active Enrollments', he: 'הרשמות פעילות' },

  // Enrollments Section
  { key: 'user.profile.billing.myEnrollments', en: 'My Enrollments', he: 'ההרשמות שלי' },
  { key: 'user.profile.billing.enrolled', en: 'Enrolled', he: 'נרשם ב' },
  { key: 'user.profile.billing.paymentPlan', en: 'Payment Plan', he: 'תוכנית תשלום' },
  { key: 'user.profile.billing.remaining', en: 'Remaining', he: 'נותר' },
  { key: 'user.profile.billing.of', en: 'of', he: 'מתוך' },
  { key: 'user.profile.billing.fullPayment', en: 'Full Payment', he: 'תשלום מלא' },
  { key: 'user.profile.billing.fullyPaidMessage', en: 'Payment completed', he: 'התשלום הושלם' },
  { key: 'user.profile.billing.completed', en: 'completed', he: 'הושלם' },
  { key: 'user.profile.billing.paymentProgress', en: 'Payment Progress', he: 'התקדמות תשלום' },

  // Payment Status
  { key: 'user.profile.billing.status.paid', en: 'Paid', he: 'שולם' },
  { key: 'user.profile.billing.status.partial', en: 'Partial', he: 'חלקי' },
  { key: 'user.profile.billing.status.pending', en: 'Pending', he: 'ממתין' },

  // Payment History
  { key: 'user.profile.billing.paymentHistory', en: 'Payment History', he: 'היסטוריית תשלומים' },
  { key: 'user.profile.billing.paymentNumber', en: 'Payment', he: 'תשלום' },
  { key: 'user.profile.billing.paidOn', en: 'Paid on', he: 'שולם בתאריך' },
  { key: 'user.profile.billing.dueOn', en: 'Due on', he: 'מועד תשלום' },
  { key: 'user.profile.billing.amount', en: 'Amount', he: 'סכום' },

  // Payment Types
  { key: 'user.profile.billing.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
  { key: 'user.profile.billing.paymentType.installment', en: 'Installment', he: 'תשלום' },

  // Payment Filters
  { key: 'user.profile.billing.filter.allProducts', en: 'All Products', he: 'כל המוצרים' },
  { key: 'user.profile.billing.filter.allStatuses', en: 'All Statuses', he: 'כל הסטטוסים' },
  { key: 'user.profile.billing.filter.allTypes', en: 'All Types', he: 'כל הסוגים' },

  // Schedule Status
  { key: 'user.profile.billing.schedule.paid', en: 'Paid', he: 'שולם' },
  { key: 'user.profile.billing.schedule.pending', en: 'Pending', he: 'ממתין לתשלום' },
  { key: 'user.profile.billing.schedule.overdue', en: 'Overdue', he: 'באיחור' },

  // Tab Labels
  { key: 'user.profile.tabs.billing', en: 'Billing', he: 'חיוב ותשלומים' },
  { key: 'user.profile.title', en: 'My Profile', he: 'הפרופיל שלי' },
  { key: 'user.profile.subtitle', en: 'Manage your personal information and preferences', he: 'נהל את המידע האישי וההעדפות שלך' },
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

    console.log(`Processing ${translations.length} translation keys...\n`);

    for (const translation of translations) {
      const { key, en, he } = translation;

      // Process Hebrew translation
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he');

      if (existingHe && existingHe.length > 0) {
        const { error: updateError } = await supabase
          .from('translations')
          .update({ translation_value: he })
          .eq('tenant_id', tenantId)
          .eq('translation_key', key)
          .eq('language_code', 'he');

        if (!updateError) {
          updatedCount++;
          console.log(`✅ Updated HE: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: he,
            language_code: 'he',
            context: 'user'
          });

        if (!insertError) {
          addedCount++;
          console.log(`➕ Added HE: ${key}`);
        }
      }

      // Process English translation
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en');

      if (existingEn && existingEn.length > 0) {
        const { error: updateError } = await supabase
          .from('translations')
          .update({ translation_value: en })
          .eq('tenant_id', tenantId)
          .eq('translation_key', key)
          .eq('language_code', 'en');

        if (!updateError) {
          updatedCount++;
          console.log(`✅ Updated EN: ${key}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: key,
            translation_value: en,
            language_code: 'en',
            context: 'user'
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
