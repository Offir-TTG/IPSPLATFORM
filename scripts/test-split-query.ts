import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testSplitQuery() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;
  const userLanguage = 'he';

  console.log('Testing NEW approach (split query)...\n');

  // Fetch general translations
  const { data: generalTranslations } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage);

  // Fetch PDF-specific translations separately
  const { data: pdfTranslationsData } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage)
    .like('translation_key', 'pdf.%');

  console.log('General translations fetched:', generalTranslations?.length || 0);
  console.log('PDF translations fetched:', pdfTranslationsData?.length || 0);

  // Merge both sets
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

  console.log('Total translations in map:', Object.keys(translations).length);

  const pdfKeys = Object.keys(translations).filter(k => k.startsWith('pdf.'));
  console.log('PDF translations in map:', pdfKeys.length);

  if (pdfKeys.length > 0) {
    console.log('\nFirst 10 PDF translations:');
    pdfKeys.slice(0, 10).forEach(k => {
      console.log(`  ${k}: ${translations[k]}`);
    });

    console.log('\nCritical PDF values:');
    console.log('  pdf.invoice.title:', translations['pdf.invoice.title']);
    console.log('  pdf.invoice.paymentPlan:', translations['pdf.invoice.paymentPlan']);
    console.log('  pdf.schedule.title:', translations['pdf.schedule.title']);
    console.log('  pdf.schedule.amount:', translations['pdf.schedule.amount']);

    if (translations['pdf.invoice.title'] && translations['pdf.schedule.title']) {
      console.log('\n✅ SUCCESS! PDF translations are now accessible!');
    } else {
      console.log('\n⚠️  Some PDF translations are missing');
    }
  } else {
    console.log('\n❌ NO PDF translations found');
  }
}

testSplitQuery();
