/**
 * Add stats section translations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  { key: 'public.stats.students', en: 'Students', he: 'סטודנטים' },
  { key: 'public.stats.courses', en: 'Courses', he: 'קורסים' },
  { key: 'public.stats.instructors', en: 'Expert Instructors', he: 'מרצים מומחים' },
  { key: 'public.stats.hours', en: 'Learning Hours', he: 'שעות למידה' },
];

async function addTranslations() {
  console.log('🌐 Adding stats section translations...\n');

  // Get tenant ID
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('❌ Error fetching tenant:', tenantError);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let addedCount = 0;
  let updatedCount = 0;

  for (const translation of translations) {
    const { key, en, he } = translation;

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'he')
      .eq('context', 'user');

    if (existingHe && existingHe.length > 0) {
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: he })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .eq('context', 'user');

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Updated HE: ${key}`);
      } else {
        console.error(`❌ Error updating HE for ${key}:`, updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: he,
          language_code: 'he',
          context: 'user'
        });

      if (!insertError) {
        addedCount++;
        console.log(`➕ Added HE: ${key}`);
      } else {
        console.error(`❌ Error adding HE for ${key}:`, insertError.message);
      }
    }

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'en')
      .eq('context', 'user');

    if (existingEn && existingEn.length > 0) {
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: en })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .eq('context', 'user');

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Updated EN: ${key}`);
      } else {
        console.error(`❌ Error updating EN for ${key}:`, updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: en,
          language_code: 'en',
          context: 'user'
        });

      if (!insertError) {
        addedCount++;
        console.log(`➕ Added EN: ${key}`);
      } else {
        console.error(`❌ Error adding EN for ${key}:`, insertError.message);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Stats translations added successfully!');
  console.log(`   ➕ Added: ${addedCount}`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log('');
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
