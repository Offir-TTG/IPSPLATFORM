import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Page title and description
  { key: 'admin.translations.title', en: 'Translation Management', he: 'ניהול תרגומים' },
  { key: 'admin.translations.subtitle', en: 'Manage translations for all languages', he: 'נהל תרגומים לכל השפות' },

  // Filter section
  { key: 'admin.translations.filterByLanguage', en: 'Filter by Language', he: 'סינון לפי שפה' },
  { key: 'admin.translations.allLanguages', en: 'All Languages', he: 'כל השפות' },
  { key: 'admin.translations.searchKeys', en: 'Search keys...', he: 'חיפוש מפתחות...' },

  // Actions
  { key: 'admin.translations.addTranslation', en: 'Add Translation', he: 'הוסף תרגום' },
  { key: 'admin.translations.edit', en: 'Edit', he: 'ערוך' },
  { key: 'admin.translations.delete', en: 'Delete', he: 'מחק' },
  { key: 'admin.translations.save', en: 'Save', he: 'שמור' },
  { key: 'admin.translations.cancel', en: 'Cancel', he: 'ביטול' },

  // Table headers
  { key: 'admin.translations.key', en: 'Key', he: 'מפתח' },
  { key: 'admin.translations.english', en: 'English', he: 'אנגלית' },
  { key: 'admin.translations.hebrew', en: 'Hebrew', he: 'עברית' },
  { key: 'admin.translations.actions', en: 'Actions', he: 'פעולות' },

  // New translation modal
  { key: 'admin.translations.newTranslationTitle', en: 'New Translation', he: 'תרגום חדש' },
  { key: 'admin.translations.translationKey', en: 'Translation Key', he: 'מפתח תרגום' },
  { key: 'admin.translations.keyPlaceholder', en: 'e.g., admin.dashboard.title', he: 'לדוגמה, admin.dashboard.title' },
  { key: 'admin.translations.englishValue', en: 'English Value', he: 'ערך באנגלית' },
  { key: 'admin.translations.englishPlaceholder', en: 'Enter English translation', he: 'הזן תרגום באנגלית' },
  { key: 'admin.translations.hebrewValue', en: 'Hebrew Value', he: 'ערך בעברית' },
  { key: 'admin.translations.hebrewPlaceholder', en: 'Enter Hebrew translation', he: 'הזן תרגום בעברית' },

  // Messages
  { key: 'admin.translations.loading', en: 'Loading translations...', he: 'טוען תרגומים...' },
  { key: 'admin.translations.noTranslations', en: 'No translations found', he: 'לא נמצאו תרגומים' },
  { key: 'admin.translations.saveSuccess', en: 'Translation saved successfully', he: 'התרגום נשמר בהצלחה' },
  { key: 'admin.translations.saveFailed', en: 'Failed to save translation', he: 'שמירת התרגום נכשלה' },
  { key: 'admin.translations.deleteSuccess', en: 'Translation deleted successfully', he: 'התרגום נמחק בהצלחה' },
  { key: 'admin.translations.deleteFailed', en: 'Failed to delete translation', he: 'מחיקת התרגום נכשלה' },
  { key: 'admin.translations.deleteConfirm', en: 'Are you sure you want to delete this translation?', he: 'האם אתה בטוח שברצונך למחוק את התרגום?' },
  { key: 'admin.translations.addSuccess', en: 'Translation added successfully', he: 'התרגום נוסף בהצלחה' },
  { key: 'admin.translations.addFailed', en: 'Failed to add translation', he: 'הוספת התרגום נכשלה' },
  { key: 'admin.translations.keyRequired', en: 'Translation key is required', he: 'מפתח התרגום נדרש' },
  { key: 'admin.translations.keyExists', en: 'This translation key already exists', he: 'מפתח תרגום זה כבר קיים' },

  // Stats/counts
  { key: 'admin.translations.totalTranslations', en: 'Total Translations', he: 'סה״כ תרגומים' },
  { key: 'admin.translations.translationCount', en: '{count} translations', he: '{count} תרגומים' },
];

async function addTranslations() {
  console.log('Starting to add translations page translations...');

  // Get the first tenant_id from the database
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('Error fetching tenant:', tenantError);
    return;
  }

  const tenantId = tenants.id;
  console.log('Using tenant_id:', tenantId);

  for (const translation of translations) {
    console.log(`Processing: ${translation.key}`);

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      console.log(`  English translation exists, updating...`);
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: translation.en })
        .eq('id', existingEn.id);

      if (updateError) {
        console.error(`  Error updating English: ${updateError.message}`);
      } else {
        console.log(`  ✓ English updated`);
      }
    } else {
      console.log(`  Creating English translation...`);
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
        });

      if (insertError) {
        console.error(`  Error creating English: ${insertError.message}`);
      } else {
        console.log(`  ✓ English created`);
      }
    }

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('tenant_id', tenantId)
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      console.log(`  Hebrew translation exists, updating...`);
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: translation.he })
        .eq('id', existingHe.id);

      if (updateError) {
        console.error(`  Error updating Hebrew: ${updateError.message}`);
      } else {
        console.log(`  ✓ Hebrew updated`);
      }
    } else {
      console.log(`  Creating Hebrew translation...`);
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
        });

      if (insertError) {
        console.error(`  Error creating Hebrew: ${insertError.message}`);
      } else {
        console.log(`  ✓ Hebrew created`);
      }
    }
  }

  console.log('\n✅ All translations processed!');
  console.log(`Total translations: ${translations.length}`);
}

addTranslations().catch(console.error);
