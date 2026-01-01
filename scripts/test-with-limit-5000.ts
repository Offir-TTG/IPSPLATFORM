import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testWithLimit5000() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;
  const userLanguage = 'he';

  console.log('Testing with limit 5000 (new export route query)...\n');

  const { data: translationsData, error: translationsError } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage)
    .limit(5000);

  console.log('Query error:', translationsError);
  console.log('Total translations fetched:', translationsData?.length || 0);

  // Convert to map
  const translations: Record<string, string> = {};
  if (translationsData && !translationsError) {
    translationsData.forEach((t: any) => {
      translations[t.translation_key] = t.translation_value;
    });
  }

  const pdfTranslations = Object.keys(translations).filter(k => k.startsWith('pdf.'));
  console.log('PDF translations count:', pdfTranslations.length);

  if (pdfTranslations.length > 0) {
    console.log('\nFirst 10 PDF translations:');
    pdfTranslations.slice(0, 10).forEach(k => {
      console.log(`  ${k}: ${translations[k]}`);
    });

    console.log('\nCritical PDF translation values:');
    console.log('  pdf.invoice.title:', translations['pdf.invoice.title']);
    console.log('  pdf.invoice.paymentPlan:', translations['pdf.invoice.paymentPlan']);
    console.log('  pdf.schedule.title:', translations['pdf.schedule.title']);
    console.log('  pdf.schedule.amount:', translations['pdf.schedule.amount']);

    if (translations['pdf.invoice.title']) {
      console.log('\n✅ SUCCESS! PDF translations are now being fetched!');
    } else {
      console.log('\n❌ FAILED! PDF translations still not found.');
    }
  } else {
    console.log('\n❌ NO PDF translations found even with limit 5000');
  }
}

testWithLimit5000();
