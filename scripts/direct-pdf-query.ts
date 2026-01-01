import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function directQuery() {
  const { data: tenants } = await adminClient.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  console.log('Query 1: Direct filter for pdf.*');
  const { data: pdfDirect, error: error1 } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .like('translation_key', 'pdf.%');

  console.log('Results:', pdfDirect?.length || 0);
  console.log('Error:', error1);
  if (pdfDirect && pdfDirect.length > 0) {
    console.log('First 5:');
    pdfDirect.slice(0, 5).forEach(t => {
      console.log('  ', t.translation_key, '=', t.translation_value);
    });
  }

  console.log('\nQuery 2: Using ilike (case-insensitive)');
  const { data: pdfIlike } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .ilike('translation_key', 'pdf.%');

  console.log('Results:', pdfIlike?.length || 0);

  console.log('\nQuery 3: Filter by translation_key starting with "pdf"');
  const { data: pdfFilter } = await adminClient
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .gte('translation_key', 'pdf.')
    .lt('translation_key', 'pdf/'); // Using range query

  console.log('Results:', pdfFilter?.length || 0);
  if (pdfFilter && pdfFilter.length > 0) {
    console.log('First 5:');
    pdfFilter.slice(0, 5).forEach(t => {
      console.log('  ', t.translation_key, '=', t.translation_value);
    });
  }
}

directQuery();
