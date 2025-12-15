import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTranslations() {
  console.log('Checking translations in database...\n');

  // Get tenant ID
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (!tenants || tenants.length === 0) {
    console.error('No tenant found');
    return;
  }

  const tenantId = tenants[0].id;
  console.log('Tenant ID:', tenantId, '\n');

  // Check for the specific translations
  const keys = ['lms.builder.lesson_order_updated', 'lms.builder.topics'];

  for (const key of keys) {
    console.log(`\n=== ${key} ===`);

    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .order('language_code');

    if (error) {
      console.error('Error:', error);
    } else if (!data || data.length === 0) {
      console.log('❌ NOT FOUND in database');
    } else {
      data.forEach(t => {
        console.log(`  ${t.language_code}: "${t.translation_value}"`);
      });
    }
  }

  // Check what the API would return for Hebrew admin context
  console.log('\n\n=== API Response Check ===');
  console.log('Fetching translations for: language=he, context=admin\n');

  const { data: apiData, error: apiError } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he')
    .in('translation_key', keys);

  if (apiError) {
    console.error('API Error:', apiError);
  } else {
    console.log('API would return:');
    console.table(apiData);
  }

  // Check if there are ANY Hebrew translations
  console.log('\n\n=== Hebrew Translation Count ===');
  const { count } = await supabase
    .from('translations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('language_code', 'he');

  console.log(`Total Hebrew translations in database: ${count}`);
}

checkTranslations().catch(console.error);
