import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTranslations() {
  console.log('🔍 Verifying enrollment translations...\n');

  try {
    // Get all enrollment-related translations
    const { data: translations, error } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .or('translation_key.like.admin.enrollments%')
      .order('translation_key')
      .order('language_code');

    if (error) {
      throw error;
    }

    // Group by translation key
    const grouped = translations?.reduce((acc: any, t) => {
      if (!acc[t.translation_key]) {
        acc[t.translation_key] = {};
      }
      acc[t.translation_key][t.language_code] = t.translation_value;
      return acc;
    }, {});

    console.log(`✅ Found ${Object.keys(grouped || {}).length} translation keys\n`);
    console.log('📋 Enrollment Translations:\n');

    Object.entries(grouped || {}).forEach(([key, values]: [string, any]) => {
      console.log(`${key}:`);
      console.log(`  EN: ${values.en || '❌ MISSING'}`);
      console.log(`  HE: ${values.he || '❌ MISSING'}`);
      console.log('');
    });

    // Check for missing translations
    const missingEn = Object.entries(grouped || {}).filter(([_, v]: [string, any]) => !v.en);
    const missingHe = Object.entries(grouped || {}).filter(([_, v]: [string, any]) => !v.he);

    if (missingEn.length > 0 || missingHe.length > 0) {
      console.log('⚠️  Missing Translations:');
      if (missingEn.length > 0) {
        console.log(`  English: ${missingEn.map(([k]) => k).join(', ')}`);
      }
      if (missingHe.length > 0) {
        console.log(`  Hebrew: ${missingHe.map(([k]) => k).join(', ')}`);
      }
    } else {
      console.log('✅ All translations complete! Both English and Hebrew are available for all keys.');
    }

  } catch (error) {
    console.error('❌ Error verifying translations:', error);
    process.exit(1);
  }
}

verifyTranslations();
