import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPdfTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }

    const tenantId = tenants[0].id;

    console.log('\n📋 Testing PDF Translations Fetch:\n');

    // Test fetching Hebrew PDF translations (like the export API does)
    const { data: hebrewTranslations, error: heError } = await supabase
      .from('translations')
      .select('translation_key, translation_value')
      .eq('tenant_id', tenantId)
      .eq('language_code', 'he');

    console.log('Total Hebrew translations:', hebrewTranslations?.length || 0);
    console.log('Query error:', heError);

    // Filter PDF translations
    const pdfTranslations = hebrewTranslations?.filter(t => t.translation_key.startsWith('pdf.')) || [];
    console.log('PDF translations (he):', pdfTranslations.length);
    if (pdfTranslations.length > 0) {
      console.log('First 5 PDF translations:');
      pdfTranslations.slice(0, 5).forEach(t => console.log(`  ${t.translation_key}: ${t.translation_value}`));
    }

    // Show some examples
    console.log('\nExamples:');
    const examples = [
      'pdf.invoice.title',
      'pdf.invoice.paymentPlan',
      'pdf.invoice.totalAmount',
      'pdf.schedule.title',
    ];

    for (const key of examples) {
      const translation = hebrewTranslations?.find(t => t.translation_key === key);
      console.log(`  ${key}: ${translation ? translation.translation_value : 'MISSING'}`);
    }

    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

testPdfTranslations();
