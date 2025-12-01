import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTranslationsContext() {
  console.log('🔧 Fixing enrollment translations context field...\n');

  try {
    // Get all enrollment translations
    const { data: translations, error: fetchError } = await supabase
      .from('translations')
      .select('id, translation_key, context, category')
      .like('translation_key', 'admin.enrollments%');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📋 Found ${translations?.length || 0} enrollment translations`);

    if (!translations || translations.length === 0) {
      console.log('⚠️  No translations found');
      return;
    }

    // Count how many need fixing
    const needsFix = translations.filter(t => t.context !== 'admin' && t.context !== 'both');
    console.log(`🔧 ${needsFix.length} translations need context update\n`);

    if (needsFix.length === 0) {
      console.log('✅ All translations already have correct context!');
      return;
    }

    // Update all enrollment translations to have context='admin' or 'both'
    // Using 'both' makes them available in both admin and user contexts
    const { error: updateError } = await supabase
      .from('translations')
      .update({ context: 'both' })
      .like('translation_key', 'admin.enrollments%');

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Successfully updated all enrollment translations to context="both"\n');

    // Verify the fix
    const { data: verifyData } = await supabase
      .from('translations')
      .select('translation_key, context, category')
      .like('translation_key', 'admin.enrollments.create%')
      .limit(5);

    console.log('✅ Verification (first 5 records):');
    verifyData?.forEach(t => {
      console.log(`   ${t.translation_key}: context="${t.context}", category="${t.category}"`);
    });

    // Clear API cache
    console.log('\n🧹 Clearing API cache...');
    try {
      await fetch('http://localhost:3000/api/translations', { method: 'POST' });
      console.log('✅ API cache cleared');
    } catch (e) {
      console.log('⚠️  API might not be running - cache will clear on next request');
    }

    console.log('\n✅ Fix complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Clear browser localStorage (see instructions from previous script)');
    console.log('2. Refresh the page');
    console.log('3. Translations should now appear!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTranslationsContext();
