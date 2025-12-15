import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTranslation() {
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';

  console.log('Adding "Paid payment cannot be changed" translation...\n');

  // English
  const { error: enError } = await supabase.rpc('upsert_translation', {
    p_language_code: 'en',
    p_translation_key: 'admin.payments.schedules.noActionsAvailable',
    p_translation_value: 'Paid payment cannot be changed',
    p_category: 'admin',
    p_context: 'admin',
    p_tenant_id: tenantId,
  });

  if (enError) {
    console.error('Error adding EN:', enError);
  } else {
    console.log('✓ Added EN: Paid payment cannot be changed');
  }

  // Hebrew
  const { error: heError } = await supabase.rpc('upsert_translation', {
    p_language_code: 'he',
    p_translation_key: 'admin.payments.schedules.noActionsAvailable',
    p_translation_value: 'תשלום ששולם לא ניתן לשינוי',
    p_category: 'admin',
    p_context: 'admin',
    p_tenant_id: tenantId,
  });

  if (heError) {
    console.error('Error adding HE:', heError);
  } else {
    console.log('✓ Added HE: תשלום ששולם לא ניתן לשינוי');
  }

  console.log('\n✅ Translation added successfully!');
}

addTranslation().catch(console.error);
