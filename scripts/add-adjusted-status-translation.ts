import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslation() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Adding "adjusted" status translation...\n');

  // English
  const { error: enError } = await supabase.rpc('upsert_translation', {
    p_language_code: 'en',
    p_translation_key: 'common.adjusted',
    p_translation_value: 'Adjusted',
    p_category: 'common',
    p_context: 'admin',
    p_tenant_id: tenantId,
  });

  if (enError) {
    console.error('Error adding EN:', enError);
  } else {
    console.log('✓ Added EN: Adjusted');
  }

  // Hebrew
  const { error: heError } = await supabase.rpc('upsert_translation', {
    p_language_code: 'he',
    p_translation_key: 'common.adjusted',
    p_translation_value: 'מותאם',
    p_category: 'common',
    p_context: 'admin',
    p_tenant_id: tenantId,
  });

  if (heError) {
    console.error('Error adding HE:', heError);
  } else {
    console.log('✓ Added HE: מותאם');
  }

  console.log('\n✅ Translation added successfully!');
}

addTranslation().catch(console.error);
