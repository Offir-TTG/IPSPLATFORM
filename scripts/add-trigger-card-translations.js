// Add trigger card translations to database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Priority translations
  { key: 'emails.triggers.priority.urgent', en: 'Urgent', he: 'דחוף' },
  { key: 'emails.triggers.priority.high', en: 'High', he: 'גבוהה' },
  { key: 'emails.triggers.priority.normal', en: 'Normal', he: 'רגילה' },
  { key: 'emails.triggers.priority.low', en: 'Low', he: 'נמוכה' },

  // Status translations
  { key: 'common.active', en: 'Active', he: 'פעיל' },
  { key: 'common.inactive', en: 'Inactive', he: 'לא פעיל' },
  { key: 'common.cancel', en: 'Cancel', he: 'ביטול' },

  // Timing translations
  { key: 'emails.triggers.timing.immediately', en: 'Immediately', he: 'מיידי' },
  { key: 'emails.triggers.timing.at', en: 'At', he: 'בשעה' },
  { key: 'emails.triggers.timing.daysBefore', en: 'days before', he: 'ימים לפני' },
  { key: 'emails.triggers.timing.beforeEvent', en: 'before event', he: 'לפני האירוע' },
  { key: 'emails.triggers.timing.afterEvent', en: 'after event', he: 'אחרי האירוע' },
  { key: 'emails.triggers.timing.hoursMinutes', en: 'h', he: 'שע\'' },
  { key: 'emails.triggers.timing.minutes', en: 'm', he: 'דק\'' },

  // Delete dialog translations
  { key: 'emails.triggers.deleteDialog.title', en: 'Delete Trigger', he: 'מחיקת טריגר' },
  { key: 'emails.triggers.deleteDialog.description', en: 'Are you sure you want to delete "{name}"? This action cannot be undone.', he: 'האם אתה בטוח שברצונך למחוק את "{name}"? פעולה זו אינה ניתנת לביטול.' },
  { key: 'emails.triggers.delete', en: 'Delete', he: 'מחק' },
  { key: 'emails.triggers.deleting', en: 'Deleting...', he: 'מוחק...' },
];

async function addTranslations() {
  console.log('Adding trigger card translations...\n');

  let added = 0;
  let errors = 0;

  for (const trans of translations) {
    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .is('tenant_id', null)
      .eq('translation_key', trans.key)
      .eq('language_code', 'en')
      .eq('context', 'admin')
      .single();

    if (existingEn) {
      // Update
      const { error: enError } = await supabase
        .from('translations')
        .update({ translation_value: trans.en })
        .eq('id', existingEn.id);

      if (enError) {
        console.error(`❌ Error updating EN for ${trans.key}:`, enError.message);
        errors++;
      } else {
        added++;
      }
    } else {
      // Insert
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          tenant_id: null,
          translation_key: trans.key,
          language_code: 'en',
          translation_value: trans.en,
          context: 'admin',
        });

      if (enError) {
        console.error(`❌ Error adding EN for ${trans.key}:`, enError.message);
        errors++;
      } else {
        added++;
      }
    }

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .is('tenant_id', null)
      .eq('translation_key', trans.key)
      .eq('language_code', 'he')
      .eq('context', 'admin')
      .single();

    if (existingHe) {
      // Update
      const { error: heError } = await supabase
        .from('translations')
        .update({ translation_value: trans.he })
        .eq('id', existingHe.id);

      if (heError) {
        console.error(`❌ Error updating HE for ${trans.key}:`, heError.message);
        errors++;
      } else {
        added++;
      }
    } else {
      // Insert
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          tenant_id: null,
          translation_key: trans.key,
          language_code: 'he',
          translation_value: trans.he,
          context: 'admin',
        });

      if (heError) {
        console.error(`❌ Error adding HE for ${trans.key}:`, heError.message);
        errors++;
      } else {
        added++;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Translation import complete!');
  console.log('='.repeat(80));
  console.log(`Added/Updated: ${added} translations`);
  console.log(`Errors: ${errors}`);
  console.log(`Total keys: ${translations.length} (${translations.length * 2} translations with EN + HE)`);
  console.log('\n🔄 Please hard refresh your browser (Ctrl + Shift + R)');
}

addTranslations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
