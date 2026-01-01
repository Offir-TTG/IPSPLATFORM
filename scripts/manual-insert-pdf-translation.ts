import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function manualInsert() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants![0].id;

  console.log('Tenant ID:', tenantId);

  // Try to insert one PDF translation
  const testTranslation = {
    tenant_id: tenantId,
    translation_key: 'pdf.invoice.title',
    translation_value: 'חשבונית הרשמה',
    language_code: 'he',
    context: 'admin'
  };

  console.log('\nTrying to insert:', testTranslation);

  const { data, error } = await supabase
    .from('translations')
    .insert(testTranslation)
    .select();

  if (error) {
    console.error('Insert error:', error.message);
    console.error('Details:', error);
  } else {
    console.log('Success! Inserted:', data);
  }

  // Try to read it back
  const { data: readBack } = await supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('translation_key', 'pdf.invoice.title')
    .eq('language_code', 'he')
    .maybeSingle();

  console.log('\nRead back:', readBack);

  // Clean up if successful
  if (readBack) {
    await supabase.from('translations').delete().eq('id', readBack.id);
    console.log('Cleaned up test translation');
  }
}

manualInsert();
