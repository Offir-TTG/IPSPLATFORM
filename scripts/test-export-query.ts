import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Create ADMIN client (like the export route does)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testExportQuery() {
  // Get tenant
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  const userLanguage = 'he';

  console.log('Testing export route query...');
  console.log('Tenant ID:', tenantId);
  console.log('Language:', userLanguage);
  console.log('');

  // THIS IS THE EXACT QUERY FROM THE EXPORT ROUTE
  const { data: translationsData, error: translationsError } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage);

  console.log('Query error:', translationsError);
  console.log('Total translations fetched:', translationsData?.length || 0);

  // Convert to key-value map (like export route does)
  const translations: Record<string, string> = {};
  if (translationsData && !translationsError) {
    translationsData.forEach((t: any) => {
      translations[t.translation_key] = t.translation_value;
    });
  }

  console.log('Translations map size:', Object.keys(translations).length);

  // Filter PDF translations (like the debug logging does)
  const pdfTranslations = Object.keys(translations).filter(k => k.startsWith('pdf.'));
  console.log('PDF translations count:', pdfTranslations.length);
  console.log('First 10 PDF translations:', pdfTranslations.slice(0, 10));

  // Test specific keys
  console.log('\nSample values:');
  console.log('  pdf.invoice.title:', translations['pdf.invoice.title']);
  console.log('  pdf.invoice.paymentPlan:', translations['pdf.invoice.paymentPlan']);
  console.log('  pdf.schedule.title:', translations['pdf.schedule.title']);
  console.log('  pdf.schedule.amount:', translations['pdf.schedule.amount']);
}

testExportQuery();
