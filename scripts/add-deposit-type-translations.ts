import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function addTranslations() {
  console.log('Adding deposit type translations...\n');

  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  const translations = [
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositType.fixed',
      translation_value: 'Fixed Amount',
      category: 'admin',
      context: 'admin'
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositType.fixed',
      translation_value: 'סכום קבוע',
      category: 'admin',
      context: 'admin'
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositType.percentage',
      translation_value: 'Percentage',
      category: 'admin',
      context: 'admin'
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositType.percentage',
      translation_value: 'אחוז',
      category: 'admin',
      context: 'admin'
    },
  ];

  for (const trans of translations) {
    const { error } = await supabase.from('translations').upsert(trans, {
      onConflict: 'tenant_id,language_code,translation_key'
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
