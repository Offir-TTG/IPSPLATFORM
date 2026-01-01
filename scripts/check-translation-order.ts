import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOrder() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  // Count total translations
  const { count } = await adminClient
    .from('translations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he');

  console.log('Total Hebrew translations in database:', count);

  // Get the first 1000 (what export route gets)
  const { data: first1000 } = await adminClient
    .from('translations')
    .select('translation_key')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .limit(1000);

  const pdfInFirst1000 = first1000?.filter(t => t.translation_key.startsWith('pdf.')) || [];
  console.log('PDF translations in first 1000:', pdfInFirst1000.length);

  // Get ALL translations without limit
  const { data: allTranslations } = await adminClient
    .from('translations')
    .select('translation_key')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .limit(10000); // Much higher limit

  console.log('Total fetched with limit 10000:', allTranslations?.length || 0);

  const pdfInAll = allTranslations?.filter(t => t.translation_key.startsWith('pdf.')) || [];
  console.log('PDF translations in all:', pdfInAll.length);

  if (pdfInAll.length > 0) {
    console.log('\nFirst 10 PDF keys:');
    pdfInAll.slice(0, 10).forEach(t => console.log('  -', t.translation_key));
  }

  // Check where PDF translations are in the order
  if (allTranslations && allTranslations.length > 0) {
    const firstPdfIndex = allTranslations.findIndex(t => t.translation_key.startsWith('pdf.'));
    console.log('\nFirst PDF translation is at index:', firstPdfIndex);
    if (firstPdfIndex >= 0) {
      console.log('That translation is:', allTranslations[firstPdfIndex].translation_key);
    }
  }
}

checkOrder();
