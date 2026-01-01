import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPdfInDb() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  console.log('Tenant ID:', tenantId);

  // Check for the exact key we tried to insert
  const { data: exact, error: exactError } = await supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('translation_key', 'pdf.invoice.title')
    .eq('language_code', 'he');

  console.log('\nSearching for exact key "pdf.invoice.title" (he):');
  console.log('Results:', exact?.length || 0);
  if (exact && exact.length > 0) {
    console.log('Found:', exact[0]);
  }
  console.log('Error:', exactError);

  // Check with LIKE pattern
  const { data: likeResults } = await supabase
    .from('translations')
    .select('translation_key, translation_value, context')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .like('translation_key', 'pdf%');

  console.log('\nUsing LIKE "pdf%":');
  console.log('Results:', likeResults?.length || 0);
  if (likeResults && likeResults.length > 0) {
    console.log('First 5:', likeResults.slice(0, 5));
  }

  // Check all contexts
  const { data: allContexts } = await supabase
    .from('translations')
    .select('context')
    .eq('tenant_id', tenantId)
    .limit(1000);

  const uniqueContexts = [...new Set(allContexts?.map(c => c.context))];
  console.log('\nUnique contexts in database:', uniqueContexts);
}

checkPdfInDb();
