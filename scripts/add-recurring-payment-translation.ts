import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslations() {
  console.log('Adding recurring payment translations...\n');

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants?.[0]?.id;

  const translations = [
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.recurringPayment',
      translation_value: 'Recurring Payment',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.recurringPayment',
      translation_value: 'תשלום קבוע',
      category: 'admin',
      context: 'admin',
    },
  ];

  for (const trans of translations) {
    const { error } = await supabase
      .from('translations')
      .upsert(trans, {
        onConflict: 'tenant_id,language_code,translation_key',
      });

    if (error) {
      console.error(`Failed to add ${trans.translation_key}:`, error);
    } else {
      console.log(`✓ Added ${trans.translation_key} (${trans.language_code})`);
    }
  }

  console.log('\n✅ All translations added!');
}

addTranslations().catch(console.error);
