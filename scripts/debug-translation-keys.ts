import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugKeys() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  // Fetch all Hebrew translations
  const { data: allTranslations } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he');

  console.log('Total translations:', allTranslations?.length || 0);

  // Find first few translations
  const first5 = allTranslations?.slice(0, 5) || [];
  console.log('\nFirst 5 translations:');
  first5.forEach(t => {
    console.log('Key:', JSON.stringify(t.translation_key));
    console.log('Value:', JSON.stringify(t.translation_value));
    console.log('Starts with pdf.?', t.translation_key.startsWith('pdf.'));
    console.log('');
  });

  // Try to find ANY that start with 'pdf'
  const pdfOnes = allTranslations?.filter(t => t.translation_key.startsWith('pdf')) || [];
  console.log('Keys starting with "pdf":', pdfOnes.length);

  const pdfDotOnes = allTranslations?.filter(t => t.translation_key.startsWith('pdf.')) || [];
  console.log('Keys starting with "pdf.":', pdfDotOnes.length);

  // Check for specific key by exact match
  const invoiceTitle = allTranslations?.find(t => t.translation_key === 'pdf.invoice.title');
  console.log('\nLooking for exact match "pdf.invoice.title":', invoiceTitle ? 'FOUND' : 'NOT FOUND');
  if (invoiceTitle) {
    console.log('Value:', invoiceTitle.translation_value);
  }

  // Show keys that contain 'invoice'
  const invoiceKeys = allTranslations?.filter(t => t.translation_key.includes('invoice')) || [];
  console.log('\nKeys containing "invoice":', invoiceKeys.length);
  invoiceKeys.slice(0, 5).forEach(t => {
    console.log('  -', JSON.stringify(t.translation_key));
  });
}

debugKeys();
