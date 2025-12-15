import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslations() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Adding payment type and status translations...\n');

  const translations = [
    // Payment types
    { key: 'admin.payments.schedules.paymentType.deposit', en: 'Deposit', he: 'מקדמה' },
    { key: 'admin.payments.schedules.paymentType.installment', en: 'Installment', he: 'תשלום' },
    { key: 'admin.payments.schedules.paymentType.full', en: 'Full Payment', he: 'תשלום מלא' },
    { key: 'admin.payments.schedules.paymentType.final', en: 'Final Payment', he: 'תשלום אחרון' },

    // Payment statuses (ensuring they exist in common namespace)
    { key: 'common.pending', en: 'Pending', he: 'ממתין' },
    { key: 'common.paid', en: 'Paid', he: 'שולם' },
    { key: 'common.overdue', en: 'Overdue', he: 'באיחור' },
    { key: 'common.failed', en: 'Failed', he: 'נכשל' },
    { key: 'common.paused', en: 'Paused', he: 'מושהה' },
    { key: 'common.cancelled', en: 'Cancelled', he: 'מבוטל' },
  ];

  for (const translation of translations) {
    // English
    const { error: enError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'en',
      p_translation_key: translation.key,
      p_translation_value: translation.en,
      p_category: translation.key.startsWith('common.') ? 'common' : 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (enError) {
      console.error(`Error adding EN for ${translation.key}:`, enError);
    } else {
      console.log(`✓ Added EN: ${translation.key} = "${translation.en}"`);
    }

    // Hebrew
    const { error: heError } = await supabase.rpc('upsert_translation', {
      p_language_code: 'he',
      p_translation_key: translation.key,
      p_translation_value: translation.he,
      p_category: translation.key.startsWith('common.') ? 'common' : 'admin',
      p_context: 'admin',
      p_tenant_id: tenantId,
    });

    if (heError) {
      console.error(`Error adding HE for ${translation.key}:`, heError);
    } else {
      console.log(`✓ Added HE: ${translation.key} = "${translation.he}"`);
    }

    console.log('');
  }

  console.log('✅ All payment type and status translations added successfully!');
}

addTranslations().catch(console.error);
