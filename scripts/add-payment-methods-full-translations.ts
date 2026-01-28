import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslations() {
  console.log('Adding complete payment methods translations (Hebrew)...\n');

  const translationPairs = [
    // Page title and buttons
    {
      key: 'user.profile.paymentMethods.title',
      context: 'user',
      en: 'Payment Methods',
      he: 'אמצעי תשלום',
    },
    {
      key: 'user.profile.paymentMethods.addNew',
      context: 'user',
      en: 'Add New Card',
      he: 'הוסף כרטיס חדש',
    },
    {
      key: 'user.profile.paymentMethods.addNewCard',
      context: 'user',
      en: 'Add New Card',
      he: 'הוסף כרטיס חדש',
    },
    {
      key: 'user.profile.paymentMethods.addCard',
      context: 'user',
      en: 'Add Card',
      he: 'הוסף כרטיס',
    },

    // Card information
    {
      key: 'user.profile.paymentMethods.default',
      context: 'user',
      en: 'Default',
      he: 'ברירת מחדל',
    },
    {
      key: 'user.profile.paymentMethods.expires',
      context: 'user',
      en: 'Expires',
      he: 'תוקף',
    },
    {
      key: 'user.profile.paymentMethods.setDefault',
      context: 'user',
      en: 'Set as Default',
      he: 'הגדר כברירת מחדל',
    },

    // Empty state
    {
      key: 'user.profile.paymentMethods.noCards',
      context: 'user',
      en: 'No Payment Methods',
      he: 'אין אמצעי תשלום',
    },
    {
      key: 'user.profile.paymentMethods.noCardsDesc',
      context: 'user',
      en: 'Add a payment method to make purchases easier.',
      he: 'הוסף אמצעי תשלום כדי להקל על ביצוע רכישות.',
    },

    // Loading states
    {
      key: 'user.profile.paymentMethods.loading',
      context: 'user',
      en: 'Loading payment methods...',
      he: 'טוען אמצעי תשלום...',
    },

    // Configuration errors
    {
      key: 'user.profile.paymentMethods.configError',
      context: 'user',
      en: 'Payment Methods Not Available',
      he: 'אמצעי תשלום אינם זמינים',
    },
    {
      key: 'user.profile.paymentMethods.configErrorDesc',
      context: 'user',
      en: 'Payment processing is not configured. Please contact support.',
      he: 'עיבוד תשלומים אינו מוגדר. אנא צור קשר עם התמיכה.',
    },

    // Success messages
    {
      key: 'user.profile.paymentMethods.addSuccess',
      context: 'user',
      en: 'Card added successfully',
      he: 'כרטיס נוסף בהצלחה',
    },
    {
      key: 'user.profile.paymentMethods.setDefaultSuccess',
      context: 'user',
      en: 'Default card updated',
      he: 'כרטיס ברירת המחדל עודכן',
    },
    {
      key: 'user.profile.paymentMethods.removeSuccess',
      context: 'user',
      en: 'Card removed successfully',
      he: 'כרטיס הוסר בהצלחה',
    },

    // Error messages
    {
      key: 'user.profile.paymentMethods.addError',
      context: 'user',
      en: 'Failed to add card',
      he: 'הוספת הכרטיס נכשלה',
    },
    {
      key: 'user.profile.paymentMethods.loadError',
      context: 'user',
      en: 'Failed to load payment methods',
      he: 'טעינת אמצעי התשלום נכשלה',
    },
    {
      key: 'user.profile.paymentMethods.setDefaultError',
      context: 'user',
      en: 'Failed to set default card',
      he: 'הגדרת כרטיס ברירת המחדל נכשלה',
    },
    {
      key: 'user.profile.paymentMethods.removeError',
      context: 'user',
      en: 'Failed to remove card',
      he: 'הסרת הכרטיס נכשלה',
    },
    {
      key: 'user.profile.paymentMethods.cannotRemoveLast',
      context: 'user',
      en: 'Cannot remove your only payment method. Please add another card first.',
      he: 'לא ניתן להסיר את אמצעי התשלום היחיד שלך. אנא הוסף כרטיס אחר תחילה.',
    },

    // Delete dialog (already added but including for completeness)
    {
      key: 'user.profile.paymentMethods.deleteTitle',
      context: 'user',
      en: 'Remove Payment Method',
      he: 'הסר אמצעי תשלום',
    },
    {
      key: 'user.profile.paymentMethods.deleteDescription',
      context: 'user',
      en: 'Are you sure you want to remove {brand} ending in {last4}? This action cannot be undone.',
      he: 'האם אתה בטוח שברצונך להסיר {brand} המסתיים ב-{last4}? פעולה זו לא ניתנת לביטול.',
    },
    {
      key: 'user.profile.paymentMethods.remove',
      context: 'user',
      en: 'Remove',
      he: 'הסר',
    },

    // Common translations (if not already in database)
    {
      key: 'common.cancel',
      context: 'common',
      en: 'Cancel',
      he: 'ביטול',
    },
  ];

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const translation of translationPairs) {
    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('translation_key', translation.key)
      .eq('language_code', 'en')
      .maybeSingle();

    if (existingEn) {
      if (existingEn.translation_value !== translation.en) {
        const { error: enError } = await supabase
          .from('translations')
          .update({
            translation_value: translation.en,
            context: translation.context
          })
          .eq('translation_key', translation.key)
          .eq('language_code', 'en');

        if (enError) {
          console.error(`❌ Error updating English translation for ${translation.key}:`, enError.message);
        } else {
          console.log(`✓ Updated English: ${translation.key}`);
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    } else {
      const { error: enError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'en',
          translation_value: translation.en,
          context: translation.context
        });

      if (enError) {
        console.error(`❌ Error adding English translation for ${translation.key}:`, enError.message);
      } else {
        console.log(`✓ Added English: ${translation.key}`);
        addedCount++;
      }
    }

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id, translation_value')
      .eq('translation_key', translation.key)
      .eq('language_code', 'he')
      .maybeSingle();

    if (existingHe) {
      if (existingHe.translation_value !== translation.he) {
        const { error: heError } = await supabase
          .from('translations')
          .update({
            translation_value: translation.he,
            context: translation.context
          })
          .eq('translation_key', translation.key)
          .eq('language_code', 'he');

        if (heError) {
          console.error(`❌ Error updating Hebrew translation for ${translation.key}:`, heError.message);
        } else {
          console.log(`✓ Updated Hebrew: ${translation.key}`);
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    } else {
      const { error: heError } = await supabase
        .from('translations')
        .insert({
          translation_key: translation.key,
          language_code: 'he',
          translation_value: translation.he,
          context: translation.context
        });

      if (heError) {
        console.error(`❌ Error adding Hebrew translation for ${translation.key}:`, heError.message);
      } else {
        console.log(`✓ Added Hebrew: ${translation.key}`);
        addedCount++;
      }
    }
  }

  console.log('\n=== Translation Summary ===');
  console.log(`Added: ${addedCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped (already up to date): ${skippedCount}`);
  console.log(`Total processed: ${translationPairs.length * 2}`);
  console.log('\n✅ All payment methods translations completed!');
}

addTranslations().catch(console.error);
