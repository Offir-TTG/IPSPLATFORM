import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixContext() {
  console.log('Fixing translation context to "both"...\n');

  // Get tenant ID
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants?.[0]?.id;

  // Update the translations to context='both' so they work in admin AND user interfaces
  const keys = ['lms.builder.lesson_order_updated', 'lms.builder.topics'];

  for (const key of keys) {
    const { error } = await supabase
      .from('translations')
      .update({ context: 'both' })
      .eq('tenant_id', tenantId)
      .eq('translation_key', key);

    if (error) {
      console.error(`Failed to update ${key}:`, error);
    } else {
      console.log(`✓ Updated ${key} to context='both'`);
    }
  }

  console.log('\n✅ All translations updated!');
  console.log('\nVerifying...\n');

  // Verify
  const { data } = await supabase
    .from('translations')
    .select('translation_key, language_code, context')
    .eq('tenant_id', tenantId)
    .in('translation_key', keys)
    .order('translation_key')
    .order('language_code');

  console.table(data);
}

fixContext().catch(console.error);
