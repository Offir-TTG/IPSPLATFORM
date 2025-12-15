import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyTranslations() {
  console.log('Applying lesson order translations...');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (tenantError || !tenants || tenants.length === 0) {
    console.error('Error fetching tenant:', tenantError);
    return;
  }

  const tenantId = tenants[0].id;
  console.log('Using tenant ID:', tenantId);

  const translations = [
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'lms.builder.lesson_order_updated',
      translation_value: 'Lesson order updated',
      category: 'lms',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'lms.builder.lesson_order_updated',
      translation_value: 'סדר השיעורים עודכן',
      category: 'lms',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'lms.builder.topics',
      translation_value: 'Topics',
      category: 'lms',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'lms.builder.topics',
      translation_value: 'נושאים',
      category: 'lms',
    },
  ];

  for (const translation of translations) {
    console.log(`\nApplying translation: ${translation.translation_key} (${translation.language_code})`);

    // Check if exists
    const { data: existing } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', translation.tenant_id)
      .eq('language_code', translation.language_code)
      .eq('translation_key', translation.translation_key)
      .single();

    if (existing) {
      console.log('  → Updating existing translation...');
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: translation.translation_value })
        .eq('tenant_id', translation.tenant_id)
        .eq('language_code', translation.language_code)
        .eq('translation_key', translation.translation_key);

      if (updateError) {
        console.error('  ✗ Error updating:', updateError);
      } else {
        console.log('  ✓ Updated successfully');
      }
    } else {
      console.log('  → Inserting new translation...');
      const { error: insertError } = await supabase
        .from('translations')
        .insert(translation);

      if (insertError) {
        console.error('  ✗ Error inserting:', insertError);
      } else {
        console.log('  ✓ Inserted successfully');
      }
    }
  }

  // Verify translations
  console.log('\n\nVerifying translations:');
  const { data: verifyData } = await supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('translation_key', ['lms.builder.lesson_order_updated', 'lms.builder.topics'])
    .order('translation_key')
    .order('language_code');

  console.table(verifyData?.map(t => ({
    key: t.translation_key,
    lang: t.language_code,
    value: t.translation_value,
  })));

  console.log('\n✅ Done!');
}

applyTranslations().catch(console.error);
