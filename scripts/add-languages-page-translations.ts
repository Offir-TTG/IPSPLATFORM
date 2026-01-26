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
  // Page titles and descriptions
  {
    key: 'admin.languages.title',
    en: 'Languages',
    he: 'שפות'
  },
  {
    key: 'admin.languages.subtitle',
    en: 'Manage platform languages and translations',
    he: 'ניהול שפות ותרגומים של הפלטפורמה'
  },
  {
    key: 'admin.languages.add',
    en: 'Add Language',
    he: 'הוסף שפה'
  },
  {
    key: 'admin.languages.edit',
    en: 'Edit Language',
    he: 'ערוך שפה'
  },

  // Badges and labels
  {
    key: 'admin.languages.default',
    en: 'Default',
    he: 'ברירת מחדל'
  },
  {
    key: 'admin.languages.active',
    en: 'Active',
    he: 'פעיל'
  },
  {
    key: 'admin.languages.inactive',
    en: 'Inactive',
    he: 'לא פעיל'
  },
  {
    key: 'admin.languages.code',
    en: 'Code',
    he: 'קוד'
  },
  {
    key: 'admin.languages.direction',
    en: 'Direction',
    he: 'כיוון'
  },
  {
    key: 'admin.languages.directionRtl',
    en: 'RTL ←',
    he: 'מימין לשמאל ←'
  },
  {
    key: 'admin.languages.directionLtr',
    en: 'LTR →',
    he: 'משמאל לימין →'
  },
  {
    key: 'admin.languages.currency',
    en: 'Currency',
    he: 'מטבע'
  },

  // Action buttons
  {
    key: 'admin.languages.setDefault',
    en: 'Default',
    he: 'ברירת מחדל'
  },
  {
    key: 'admin.languages.setDefaultTitle',
    en: 'Set as default',
    he: 'הגדר כברירת מחדל'
  },
  {
    key: 'admin.languages.toggleActive',
    en: 'Toggle status',
    he: 'החלף מצב'
  },
  {
    key: 'admin.languages.hide',
    en: 'Hide',
    he: 'הסתר'
  },
  {
    key: 'admin.languages.show',
    en: 'Show',
    he: 'הצג'
  },
  {
    key: 'admin.languages.editTitle',
    en: 'Edit',
    he: 'ערוך'
  },
  {
    key: 'admin.languages.deleteTitle',
    en: 'Delete',
    he: 'מחק'
  },

  // Empty state
  {
    key: 'admin.languages.empty',
    en: 'No languages yet',
    he: 'אין עדיין שפות'
  },
  {
    key: 'admin.languages.emptyDesc',
    en: 'Add your first language to get started',
    he: 'הוסף את השפה הראשונה שלך כדי להתחיל'
  },

  // Form fields
  {
    key: 'admin.languages.form.code',
    en: 'Language Code',
    he: 'קוד שפה'
  },
  {
    key: 'admin.languages.form.selectLanguage',
    en: 'Select a language...',
    he: 'בחר שפה...'
  },
  {
    key: 'admin.languages.form.noResults',
    en: 'No languages found',
    he: 'לא נמצאו שפות'
  },
  {
    key: 'admin.languages.form.popularLanguages',
    en: 'Popular Languages',
    he: 'שפות פופולריות'
  },
  {
    key: 'admin.languages.form.otherLanguages',
    en: 'Other Languages',
    he: 'שפות אחרות'
  },
  {
    key: 'admin.languages.form.codeHint',
    en: '2-letter ISO 639-1 code',
    he: 'קוד ISO 639-1 בן 2 אותיות'
  },
  {
    key: 'admin.languages.form.selectHint',
    en: 'Selecting a language will auto-fill the form',
    he: 'בחירת שפה תמלא את הטופס אוטומטית'
  },
  {
    key: 'admin.languages.form.name',
    en: 'English Name',
    he: 'שם באנגלית'
  },
  {
    key: 'admin.languages.form.nativeName',
    en: 'Native Name',
    he: 'שם בשפת המקור'
  },
  {
    key: 'admin.languages.form.direction',
    en: 'Text Direction',
    he: 'כיוון טקסט'
  },
  {
    key: 'admin.languages.form.directionLtr',
    en: 'Left to Right (LTR)',
    he: 'משמאל לימין (LTR)'
  },
  {
    key: 'admin.languages.form.directionRtl',
    en: 'Right to Left (RTL)',
    he: 'מימין לשמאל (RTL)'
  },
  {
    key: 'admin.languages.form.directionHint',
    en: 'Will be auto-filled when you select a language',
    he: 'ימולא אוטומטית כאשר תבחר שפה'
  },
  {
    key: 'admin.languages.form.currency',
    en: 'Currency',
    he: 'מטבע'
  },
  {
    key: 'admin.languages.form.currencyAutoFill',
    en: 'Will be auto-filled when you select a language',
    he: 'ימולא אוטומטית כאשר תבחר שפה'
  },
  {
    key: 'admin.languages.form.currencyHint',
    en: 'Default currency for this language',
    he: 'מטבע ברירת מחדל לשפה זו'
  },
  {
    key: 'admin.languages.form.active',
    en: 'Active',
    he: 'פעיל'
  },
  {
    key: 'admin.languages.form.default',
    en: 'Default Language',
    he: 'שפת ברירת מחדל'
  },

  // Delete confirmation
  {
    key: 'admin.languages.confirmDelete.title',
    en: 'Delete Language',
    he: 'מחק שפה'
  },
  {
    key: 'admin.languages.confirmDelete.message',
    en: 'Are you sure you want to delete',
    he: 'האם אתה בטוח שברצונך למחוק'
  },
  {
    key: 'admin.languages.confirmDelete.warning',
    en: 'This action cannot be undone. All translations for this language will be deleted.',
    he: 'פעולה זו לא ניתנת לביטול. כל התרגומים לשפה זו יימחקו.'
  },
  {
    key: 'admin.languages.confirmDelete.confirm',
    en: 'Delete',
    he: 'מחק'
  },

  // Errors
  {
    key: 'admin.languages.error.required',
    en: 'All fields are required',
    he: 'כל השדות נדרשים'
  },
  {
    key: 'admin.languages.error.codeLength',
    en: 'Language code must be 2 characters (ISO 639-1)',
    he: 'קוד השפה חייב להיות בן 2 תווים (ISO 639-1)'
  }
];

async function addTranslations() {
  try {
    console.log('Adding languages page translations...');

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
