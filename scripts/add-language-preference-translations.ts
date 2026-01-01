/**
 * Add Hebrew translations for Language Preference Dialog
 * Run: npx tsx scripts/add-language-preference-translations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Language Preference Dialog - Hebrew
  {
    key: 'user.profile.preferences.language',
    he: 'שפה',
    en: 'Language',
  },
  {
    key: 'user.profile.preferences.languageAuto',
    he: 'אוטומטי (ברירת המחדל של הארגון)',
    en: 'Auto (Organization Default)',
  },
  {
    key: 'user.profile.preferences.selectLanguage',
    he: 'בחר את השפה המועדפת עליך',
    en: 'Select Your Preferred Language',
  },
  {
    key: 'user.profile.preferences.languageDescription',
    he: 'בחר את השפה שבה תרצה להשתמש בממשק. זה ידרוס את ברירת המחדל של הארגון.',
    en: 'Choose the language you want to use for the interface. This will override the organization default.',
  },
  {
    key: 'user.profile.preferences.languageAutoDescription',
    he: 'השתמש בהגדרת השפה המוגדרת כברירת מחדל של הארגון שלך',
    en: 'Use your organization\'s default language setting',
  },
  {
    key: 'user.profile.preferences.availableLanguages',
    he: 'שפות זמינות',
    en: 'Available Languages',
  },
  {
    key: 'user.profile.preferences.languageUpdated',
    he: 'העדפת השפה עודכנה בהצלחה',
    en: 'Language preference updated successfully',
  },
  {
    key: 'user.profile.preferences.languageUpdateError',
    he: 'נכשל לעדכן את העדפת השפה',
    en: 'Failed to update language preference',
  },
  {
    key: 'user.profile.preferences.regional_settings',
    he: 'הגדרות אזוריות',
    en: 'Regional Settings',
  },
  {
    key: 'user.profile.preferences.change',
    he: 'שנה',
    en: 'Change',
  },
  {
    key: 'user.profile.preferences.timezone',
    he: 'אזור זמן',
    en: 'Timezone',
  },
  // Language-specific descriptions
  {
    key: 'user.profile.preferences.languageDescription.en',
    he: 'הצג את הממשק באנגלית',
    en: 'Display interface in English',
  },
  {
    key: 'user.profile.preferences.languageDescription.he',
    he: 'הצג את הממשק בעברית',
    en: 'Display interface in Hebrew',
  },
  {
    key: 'user.profile.preferences.languageDescription.es',
    he: 'הצג את הממשק בספרדית',
    en: 'Display interface in Spanish',
  },
  {
    key: 'user.profile.preferences.languageDescription.fr',
    he: 'הצג את הממשק בצרפתית',
    en: 'Display interface in French',
  },
  // Common buttons
  {
    key: 'common.cancel',
    he: 'ביטול',
    en: 'Cancel',
  },
  {
    key: 'common.save',
    he: 'שמור שינויים',
    en: 'Save Changes',
  },
  {
    key: 'common.saving',
    he: 'שומר...',
    en: 'Saving...',
  },
];

async function addTranslations() {
  console.log('Adding language preference translations...');

  for (const translation of translations) {
    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .single();

    if (existingHe) {
      // Update existing Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .update({
          translation_value: translation.he,
          category: 'user',
          context: 'user',
        })
        .eq('translation_key', translation.key)
        .eq('language_code', 'he');

      if (heError) {
        console.error(`Error updating Hebrew translation for ${translation.key}:`, heError);
      } else {
        console.log(`✓ Updated Hebrew translation for ${translation.key}`);
      }
    } else {
      // Insert new Hebrew translation
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          category: 'user',
          context: 'user',
        });

      if (heError) {
        console.error(`Error adding Hebrew translation for ${translation.key}:`, heError);
      } else {
        console.log(`✓ Added Hebrew translation for ${translation.key}`);
      }
    }

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .single();

    if (existingEn) {
      // Update existing English translation
      const { error: enError } = await supabase
        .from('translations')
        .update({
          translation_value: translation.en,
          category: 'user',
          context: 'user',
        })
        .eq('translation_key', translation.key)
        .eq('language_code', 'en');

      if (enError) {
        console.error(`Error updating English translation for ${translation.key}:`, enError);
      } else {
        console.log(`✓ Updated English translation for ${translation.key}`);
      }
    } else {
      // Insert new English translation
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          category: 'user',
          context: 'user',
        });

      if (enError) {
        console.error(`Error adding English translation for ${translation.key}:`, enError);
      } else {
        console.log(`✓ Added English translation for ${translation.key}`);
      }
    }
  }

  console.log('\n✅ All translations added successfully!');
}

addTranslations()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
