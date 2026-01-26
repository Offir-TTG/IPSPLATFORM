import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Error messages
  {
    key: 'api.languages.error.unauthorized',
    en: 'Unauthorized or insufficient permissions',
    he: 'אין הרשאה או הרשאות לא מספיקות'
  },
  {
    key: 'api.languages.error.missing_fields',
    en: 'Missing required fields',
    he: 'חסרים שדות נדרשים'
  },
  {
    key: 'api.languages.error.fetch_failed',
    en: 'Failed to fetch languages',
    he: 'כשל בטעינת השפות'
  },
  {
    key: 'api.languages.error.create_failed',
    en: 'Failed to create language',
    he: 'כשל ביצירת השפה'
  },
  {
    key: 'api.languages.error.update_failed',
    en: 'Failed to update language',
    he: 'כשל בעדכון השפה'
  },
  {
    key: 'api.languages.error.delete_failed',
    en: 'Failed to delete language',
    he: 'כשל במחיקת השפה'
  },
  {
    key: 'api.languages.error.code_required',
    en: 'Language code is required',
    he: 'קוד שפה נדרש'
  },
  {
    key: 'api.languages.error.not_found',
    en: 'Language not found',
    he: 'השפה לא נמצאה'
  },
  {
    key: 'api.languages.error.cannot_delete_default',
    en: 'Cannot delete default language',
    he: 'לא ניתן למחוק את שפת ברירת המחדל'
  },

  // Success messages
  {
    key: 'api.languages.success.created',
    en: 'Language created successfully',
    he: 'השפה נוצרה בהצלחה'
  },
  {
    key: 'api.languages.success.updated',
    en: 'Language updated successfully',
    he: 'השפה עודכנה בהצלחה'
  },
  {
    key: 'api.languages.success.deleted',
    en: 'Language deleted successfully',
    he: 'השפה נמחקה בהצלחה'
  },
  {
    key: 'api.languages.success.activated',
    en: 'Language activated successfully',
    he: 'השפה הופעלה בהצלחה'
  },
  {
    key: 'api.languages.success.deactivated',
    en: 'Language deactivated successfully',
    he: 'השפה הושבתה בהצלחה'
  }
];

async function addTranslations() {
  try {
    console.log('Adding language API translations...');

    for (const translation of translations) {
      // Check and add/update English translation
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .maybeSingle();

      if (existingEn) {
        const { error: enError } = await supabase
          .from('translations')
          .update({
            translation_value: translation.en,
            context: 'admin'
          })
          .eq('translation_key', translation.key)
          .eq('language_code', 'en');

        if (enError) {
          console.error(`Error updating EN translation for ${translation.key}:`, enError);
        } else {
          console.log(`✓ Updated EN: ${translation.key}`);
        }
      } else {
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            translation_key: translation.key,
            language_code: 'en',
            translation_value: translation.en,
            context: 'admin'
          });

        if (enError) {
          console.error(`Error adding EN translation for ${translation.key}:`, enError);
        } else {
          console.log(`✓ Added EN: ${translation.key}`);
        }
      }

      // Check and add/update Hebrew translation
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .maybeSingle();

      if (existingHe) {
        const { error: heError } = await supabase
          .from('translations')
          .update({
            translation_value: translation.he,
            context: 'admin'
          })
          .eq('translation_key', translation.key)
          .eq('language_code', 'he');

        if (heError) {
          console.error(`Error updating HE translation for ${translation.key}:`, heError);
        } else {
          console.log(`✓ Updated HE: ${translation.key}`);
        }
      } else {
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            translation_key: translation.key,
            language_code: 'he',
            translation_value: translation.he,
            context: 'admin'
          });

        if (heError) {
          console.error(`Error adding HE translation for ${translation.key}:`, heError);
        } else {
          console.log(`✓ Added HE: ${translation.key}`);
        }
      }
    }

    console.log('\n✅ All translations added successfully!');
  } catch (error) {
    console.error('Error adding translations:', error);
    process.exit(1);
  }
}

addTranslations();
