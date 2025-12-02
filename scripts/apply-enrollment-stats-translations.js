const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyTranslations() {
  console.log('Applying enrollment statistics sidebar translations...\n');

  const translations = [
    // Section title
    { key: 'lms.builder.enrollment_stats', en: 'Enrollment Statistics', he: 'סטטיסטיקת הרשמות' },

    // Total Enrollments
    { key: 'lms.builder.total_enrollments', en: 'Total Enrollments', he: 'סה"כ הרשמות' },

    // Lifetime Sales
    { key: 'lms.builder.lifetime_sales', en: 'Lifetime Sales', he: 'מכירות כוללות' },

    // Completed
    { key: 'lms.builder.completed', en: 'Completed', he: 'הושלם' },

    // In Progress
    { key: 'lms.builder.in_progress', en: 'In Progress', he: 'בתהליך' },

    // Not Started
    { key: 'lms.builder.not_started', en: 'Not Started', he: 'טרם התחיל' },

    // Students label
    { key: 'lms.builder.students', en: 'students', he: 'תלמידים' },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const trans of translations) {
    // Insert or update English translation
    const { error: enError } = await supabase
      .from('translations')
      .upsert({
        translation_key: trans.key,
        language_code: 'en',
        translation_value: trans.en,
        context: 'admin',
        tenant_id: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'translation_key,language_code,context',
        ignoreDuplicates: false,
      });

    if (enError) {
      console.error(`❌ Error inserting EN translation for ${trans.key}:`, enError.message);
      errorCount++;
    } else {
      console.log(`✅ ${trans.key} (EN): ${trans.en}`);
      successCount++;
    }

    // Insert or update Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .upsert({
        translation_key: trans.key,
        language_code: 'he',
        translation_value: trans.he,
        context: 'admin',
        tenant_id: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'translation_key,language_code,context',
        ignoreDuplicates: false,
      });

    if (heError) {
      console.error(`❌ Error inserting HE translation for ${trans.key}:`, heError.message);
      errorCount++;
    } else {
      console.log(`✅ ${trans.key} (HE): ${trans.he}`);
      successCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n🎉 Enrollment statistics sidebar translations applied successfully!`);

  process.exit(errorCount > 0 ? 1 : 0);
}

applyTranslations();
