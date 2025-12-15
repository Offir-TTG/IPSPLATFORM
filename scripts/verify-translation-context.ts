import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyContext() {
  console.log('Checking translation context field...\n');

  // Get tenant ID
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants?.[0]?.id;
  console.log('Tenant ID:', tenantId, '\n');

  // Check the specific translations with all fields
  const { data, error } = await supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('translation_key', ['lms.builder.lesson_order_updated', 'lms.builder.topics']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found translations:');
  console.table(data?.map(t => ({
    key: t.translation_key,
    lang: t.language_code,
    value: t.translation_value,
    context: t.context || '❌ NULL',
    category: t.category,
  })));

  // Check if context field is missing
  const missingContext = data?.filter(t => !t.context) || [];
  if (missingContext.length > 0) {
    console.log('\n⚠️  WARNING: Found translations without context field!');
    console.log('These translations will NOT be returned by the API when context=admin');
    console.log('\nFixing context field...\n');

    // Fix the context field
    for (const trans of missingContext) {
      const { error: updateError } = await supabase
        .from('translations')
        .update({ context: 'both' })
        .eq('id', trans.id);

      if (updateError) {
        console.error(`Failed to update ${trans.translation_key}:`, updateError);
      } else {
        console.log(`✓ Updated ${trans.translation_key} (${trans.language_code}) with context='both'`);
      }
    }

    console.log('\n✅ Context field updated for all translations');
  } else {
    console.log('\n✅ All translations have context field set correctly');
  }
}

verifyContext().catch(console.error);
