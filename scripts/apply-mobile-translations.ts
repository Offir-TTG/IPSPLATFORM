import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Mobile shortened button labels
  { key: 'lms.builder.bulk', en: 'Bulk', he: 'מרובה' },
  { key: 'lms.builder.add', en: 'Add', he: 'הוסף' },
  { key: 'lms.builder.back', en: 'Back', he: 'חזור' },
  { key: 'lms.builder.preview', en: 'Preview', he: 'תצוגה מקדימה' },
  { key: 'lms.builder.publish', en: 'Publish', he: 'פרסם' },
  { key: 'lms.builder.unpublish', en: 'Unpublish', he: 'בטל פרסום' },
  { key: 'lms.builder.minutes_abbr', en: 'min', he: 'דק\'' },
];

async function applyTranslations() {
  console.log('🚀 Starting mobile translations migration...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const { key, en, he } of translations) {
    try {
      // Insert EN translation
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: key,
          language_code: 'en',
          translation_value: en,
          context: 'admin',
          tenant_id: null,
        });

      if (enError) {
        console.error(`❌ ${key} (EN):`, enError.message);
        errorCount++;
      } else {
        successCount++;
      }

      // Insert HE translation
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: key,
          language_code: 'he',
          translation_value: he,
          context: 'admin',
          tenant_id: null,
        });

      if (heError) {
        console.error(`❌ ${key} (HE):`, heError.message);
        errorCount++;
      } else {
        successCount++;
      }

      if (!enError && !heError) {
        console.log(`✅ ${key}`);
      }
    } catch (error) {
      console.error(`❌ ${key}:`, error);
      errorCount += 2;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount} translations`);
  console.log(`   ❌ Failed: ${errorCount} translations`);
  console.log(`\n✨ Mobile translations migration complete!`);
}

applyTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
