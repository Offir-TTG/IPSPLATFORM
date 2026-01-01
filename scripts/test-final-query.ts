import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testFinalQuery() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;
  const userLanguage = 'he';

  console.log('Testing FINAL approach (with billing translations)...\n');

  // Fetch general translations
  const { data: generalTranslations } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage);

  // Fetch PDF-specific translations
  const { data: pdfTranslationsData } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage)
    .like('translation_key', 'pdf.%');

  // Fetch billing translations
  const { data: billingTranslationsData } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage)
    .like('translation_key', 'user.profile.billing%');

  console.log('General translations fetched:', generalTranslations?.length || 0);
  console.log('PDF translations fetched:', pdfTranslationsData?.length || 0);
  console.log('Billing translations fetched:', billingTranslationsData?.length || 0);

  // Merge
  const translations: Record<string, string> = {};

  if (generalTranslations) {
    generalTranslations.forEach((t: any) => {
      translations[t.translation_key] = t.translation_value;
    });
  }

  if (pdfTranslationsData) {
    pdfTranslationsData.forEach((t: any) => {
      translations[t.translation_key] = t.translation_value;
    });
  }

  if (billingTranslationsData) {
    billingTranslationsData.forEach((t: any) => {
      translations[t.translation_key] = t.translation_value;
    });
  }

  console.log('\nTotal translations in map:', Object.keys(translations).length);

  // Test critical translations
  console.log('\n✅ CRITICAL TRANSLATIONS:');
  console.log('  pdf.invoice.title:', translations['pdf.invoice.title'] || '❌ MISSING');
  console.log('  pdf.schedule.title:', translations['pdf.schedule.title'] || '❌ MISSING');
  console.log('  user.profile.billing.oneTimePayment:', translations['user.profile.billing.oneTimePayment'] || '❌ MISSING');
  console.log('  user.profile.billing.subscription:', translations['user.profile.billing.subscription'] || '❌ MISSING');

  if (
    translations['pdf.invoice.title'] &&
    translations['pdf.schedule.title'] &&
    translations['user.profile.billing.oneTimePayment']
  ) {
    console.log('\n🎉 SUCCESS! All critical translations are now available!');
  } else {
    console.log('\n❌ FAILED - Some translations are still missing');
  }
}

testFinalQuery();
