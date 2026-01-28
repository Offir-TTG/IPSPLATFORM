import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Translation {
  key: string;
  en: string;
  he: string;
  context: string;
}

const translations: Translation[] = [
  // Admin context
  {
    key: 'admin.enrollments.productType.program',
    en: 'Program',
    he: 'תוכנית',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.course',
    en: 'Course',
    he: 'קורס',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.lecture',
    en: 'Lecture',
    he: 'הרצאה',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.workshop',
    en: 'Workshop',
    he: 'סדנה',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.webinar',
    en: 'Webinar',
    he: 'וובינר',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.session',
    en: 'Session',
    he: 'מפגש',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.session_pack',
    en: 'Session Pack',
    he: 'חבילת מפגשים',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.bundle',
    en: 'Bundle',
    he: 'חבילה',
    context: 'admin'
  },
  {
    key: 'admin.enrollments.productType.custom',
    en: 'Custom',
    he: 'מותאם אישית',
    context: 'admin'
  },
  // Enrollment (public) context - using 'user' context
  {
    key: 'enrollment.productType.program',
    en: 'Program',
    he: 'תוכנית',
    context: 'user'
  },
  {
    key: 'enrollment.productType.course',
    en: 'Course',
    he: 'קורס',
    context: 'user'
  },
  {
    key: 'enrollment.productType.lecture',
    en: 'Lecture',
    he: 'הרצאה',
    context: 'user'
  },
  {
    key: 'enrollment.productType.workshop',
    en: 'Workshop',
    he: 'סדנה',
    context: 'user'
  },
  {
    key: 'enrollment.productType.webinar',
    en: 'Webinar',
    he: 'וובינר',
    context: 'user'
  },
  {
    key: 'enrollment.productType.session',
    en: 'Session',
    he: 'מפגש',
    context: 'user'
  },
  {
    key: 'enrollment.productType.session_pack',
    en: 'Session Pack',
    he: 'חבילת מפגשים',
    context: 'user'
  },
  {
    key: 'enrollment.productType.bundle',
    en: 'Bundle',
    he: 'חבילה',
    context: 'user'
  },
  {
    key: 'enrollment.productType.custom',
    en: 'Custom',
    he: 'מותאם אישית',
    context: 'user'
  }
];

async function addProductTypeTranslations() {
  console.log('🌐 Adding Product Type Translations\n');
  console.log('=' .repeat(60));

  let successCount = 0;
  let failureCount = 0;

  for (const translation of translations) {
    console.log(`\n📝 ${translation.key}`);

    try {
      // Check if translation already exists
      const { data: existing } = await supabase
        .from('translations')
        .select('id')
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .maybeSingle();

      if (existing) {
        console.log(`   ⚠️  Already exists, skipping...`);
        continue;
      }

      // Insert English translation
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          context: translation.context
        });

      if (enError) {
        console.log(`   ❌ EN failed: ${enError.message}`);
        failureCount++;
        continue;
      }

      // Insert Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          context: translation.context
        });

      if (heError) {
        console.log(`   ❌ HE failed: ${heError.message}`);
        failureCount++;
        continue;
      }

      console.log(`   ✅ EN: ${translation.en}`);
      console.log(`   ✅ HE: ${translation.he}`);
      successCount++;

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      failureCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📈 Total: ${translations.length}`);

  if (successCount > 0) {
    console.log('\n🎉 Product type translations added successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Refresh the enrollment wizard and admin pages');
    console.log('   2. Product types should now display in Hebrew');
    console.log('   3. Contexts: admin (admin panel) & enrollment (public wizard)');
    console.log('   4. Example: "session_pack" → "חבילת מפגשים"');
  }
}

addProductTypeTranslations().then(() => process.exit(0));
