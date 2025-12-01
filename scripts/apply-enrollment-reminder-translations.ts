/**
 * Apply Enrollment Reminder Template Translations
 * Adds the missing translations for the enrollment.reminder template
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyTranslations() {
  console.log('🌐 Adding enrollment reminder template translations...\n');

  const translations = [
    {
      translation_key: 'email_template.enrollment_reminder.name',
      language_code: 'en',
      translation_value: 'Enrollment Reminder',
      context: 'admin'
    },
    {
      translation_key: 'email_template.enrollment_reminder.name',
      language_code: 'he',
      translation_value: 'תזכורת הרשמה',
      context: 'admin'
    },
    {
      translation_key: 'email_template.enrollment_reminder.description',
      language_code: 'en',
      translation_value: 'Sent to remind users about pending enrollment or incomplete registration',
      context: 'admin'
    },
    {
      translation_key: 'email_template.enrollment_reminder.description',
      language_code: 'he',
      translation_value: 'נשלח כדי להזכיר למשתמשים על הרשמה ממתינה או רישום לא מושלם',
      context: 'admin'
    }
  ];

  let successCount = 0;
  let skipCount = 0;

  for (const trans of translations) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', trans.translation_key)
      .eq('language_code', trans.language_code)
      .eq('context', trans.context)
      .is('tenant_id', null)
      .single();

    if (existing) {
      console.log(`⏭️  Skipping ${trans.translation_key} (${trans.language_code}) - already exists`);
      skipCount++;
      continue;
    }

    // Insert new translation
    const { error } = await supabase
      .from('translations')
      .insert({
        tenant_id: null,
        ...trans
      });

    if (error) {
      console.error(`❌ Error inserting ${trans.translation_key} (${trans.language_code}):`, error);
    } else {
      console.log(`✅ Added ${trans.translation_key} (${trans.language_code})`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Translation update complete!`);
  console.log(`   ✅ Added: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log('');
}

applyTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
