const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // English - Payment Summary
  { lang: 'en', key: 'user.dashboard.payment.title', value: 'Payment Summary', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.subtitle', value: 'Your enrollment payments at a glance', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.totalPaid', value: 'Total Paid', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.outstanding', value: 'Outstanding', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.totalValue', value: 'Total Value', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.enrollmentsWithBalance', value: 'enrollments with balance', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.activeEnrollments', value: 'active enrollments', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.overallProgress', value: 'Overall Payment Progress', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.pendingPayments', value: 'Pending Payments', ctx: 'user' },
  { lang: 'en', key: 'user.dashboard.payment.viewAllPayments', value: 'View All Payments & Invoices', ctx: 'user' },

  // Hebrew - Payment Summary
  { lang: 'he', key: 'user.dashboard.payment.title', value: 'סיכום תשלומים', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.subtitle', value: 'תשלומי ההרשמה שלך במבט', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.totalPaid', value: 'סה"כ שולם', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.outstanding', value: 'יתרה לתשלום', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.totalValue', value: 'ערך כולל', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.enrollmentsWithBalance', value: 'הרשמות עם יתרה', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.activeEnrollments', value: 'הרשמות פעילות', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.overallProgress', value: 'התקדמות תשלומים כללית', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.pendingPayments', value: 'תשלומים ממתינים', ctx: 'user' },
  { lang: 'he', key: 'user.dashboard.payment.viewAllPayments', value: 'צפה בכל התשלומים והחשבוניות', ctx: 'user' },
];

async function addTranslations() {
  console.log('Adding payment summary translations...\n');

  try {
    // Get tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Delete existing translations with these keys first
    console.log('Cleaning up existing translations...');
    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.dashboard.payment.%');

    console.log('✓ Cleaned up existing translations\n');

    console.log(`\nInserting ${translations.length} translations...\n`);

    const records = translations.map(t => ({
      language_code: t.lang,
      translation_key: t.key,
      translation_value: t.value,
      context: t.ctx,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('translations')
      .insert(records);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      throw insertError;
    }

    console.log('✅ All payment summary translations added successfully!');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

addTranslations();
