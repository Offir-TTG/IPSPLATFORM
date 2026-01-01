import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listKeys() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  // Get all unique translation keys for Hebrew
  const { data } = await supabase
    .from('translations')
    .select('translation_key')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .order('translation_key');

  const uniqueKeys = [...new Set(data?.map(t => t.translation_key) || [])];

  console.log(`Total unique translation keys: ${uniqueKeys.length}\n`);

  // Show keys that contain 'pdf'
  const pdfKeys = uniqueKeys.filter(k => k.toLowerCase().includes('pdf'));
  console.log(`Keys containing 'pdf': ${pdfKeys.length}`);
  pdfKeys.forEach(k => console.log('  ', k));

  // Show keys that start with 'pdf.'
  const pdfPrefixKeys = uniqueKeys.filter(k => k.startsWith('pdf.'));
  console.log(`\nKeys starting with 'pdf.': ${pdfPrefixKeys.length}`);
  pdfPrefixKeys.slice(0, 20).forEach(k => console.log('  ', k));

  // Show first 20 keys
  console.log('\nFirst 20 translation keys:');
  uniqueKeys.slice(0, 20).forEach(k => console.log('  ', k));
}

listKeys();
