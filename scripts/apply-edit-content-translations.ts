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
  // Edit Content dialog
  { key: 'lms.topics.edit_content', en: 'Edit Content', he: 'עריכת תוכן' },
  { key: 'lms.topics.edit_content_description', en: 'Add and organize content blocks for this lesson', he: 'הוסף וארגן בלוקים של תוכן לשיעור זה' },
  { key: 'lms.topics.edit_topic', en: 'Edit Content Block', he: 'עריכת בלוק תוכן' },
];

async function applyTranslations() {
  console.log('🚀 Starting Edit Content dialog translations migration...\n');

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
  console.log(`\n✨ Edit Content translations migration complete!`);
}

applyTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
