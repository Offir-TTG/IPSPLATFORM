const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTranslation() {
  console.log('Fixing Hebrew translation with mixed Arabic characters...\n');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError);
    return;
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  // Fix the problematic translation
  const correctHebrewText = 'למד מיומנויות חדשות עם הקורסים המעוצבים בקפידה';

  const { data: existing, error: fetchError } = await supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('translation_key', 'public.courses.subtitle')
    .eq('language_code', 'he')
    .eq('context', 'user');

  if (fetchError) {
    console.error('Error fetching translation:', fetchError);
    return;
  }

  if (existing && existing.length > 0) {
    console.log('Current Hebrew text:', existing[0].translation_value);
    console.log('Correct Hebrew text:', correctHebrewText);

    const { error: updateError } = await supabase
      .from('translations')
      .update({ translation_value: correctHebrewText })
      .eq('tenant_id', tenantId)
      .eq('translation_key', 'public.courses.subtitle')
      .eq('language_code', 'he')
      .eq('context', 'user');

    if (!updateError) {
      console.log('\n✅ Successfully updated Hebrew translation!');
      console.log('   Changed "מהארות" (mixed Arabic) to "מיומנויות" (proper Hebrew)');
    } else {
      console.error('Error updating translation:', updateError);
    }
  } else {
    console.log('No existing translation found. Creating new one...');

    const { error: insertError } = await supabase
      .from('translations')
      .insert({
        tenant_id: tenantId,
        translation_key: 'public.courses.subtitle',
        translation_value: correctHebrewText,
        language_code: 'he',
        context: 'user'
      });

    if (!insertError) {
      console.log('\n✅ Successfully added Hebrew translation!');
    } else {
      console.error('Error adding translation:', insertError);
    }
  }
}

fixTranslation().catch(console.error);
