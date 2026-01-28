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
  console.log('Adding Stripe validation error translations...\n');

  const translationPairs = [
    // Card validation errors
    {
      key: 'stripe.errors.incompleteNumber',
      context: 'user',
      en: 'Your card number is incomplete.',
      he: 'מספר הכרטיס שלך אינו שלם.',
    },
    {
      key: 'stripe.errors.incompleteExpiry',
      context: 'user',
      en: 'Your card\'s expiration date is incomplete.',
      he: 'תאריך התפוגה של הכרטיס אינו שלם.',
    },
    {
      key: 'stripe.errors.incompleteCvc',
      context: 'user',
      en: 'Your card\'s security code is incomplete.',
      he: 'קוד האבטחה של הכרטיס אינו שלם.',
    },
    {
      key: 'stripe.errors.incompleteZip',
      context: 'user',
      en: 'Your postal code is incomplete.',
      he: 'המיקוד שלך אינו שלם.',
    },
    {
      key: 'stripe.errors.invalidNumber',
      context: 'user',
      en: 'Your card number is invalid.',
      he: 'מספר הכרטיס שגוי.',
    },
    {
      key: 'stripe.errors.invalidExpiry',
      context: 'user',
      en: 'Your card\'s expiration date is invalid.',
      he: 'תאריך התפוגה של הכרטיס שגוי.',
    },
    {
      key: 'stripe.errors.invalidCvc',
      context: 'user',
      en: 'Your card\'s security code is invalid.',
      he: 'קוד האבטחה של הכרטיס שגוי.',
    },
    {
      key: 'stripe.errors.expiredCard',
      context: 'user',
      en: 'Your card has expired.',
      he: 'הכרטיס שלך פג תוקף.',
    },
    {
      key: 'stripe.errors.incorrectCvc',
      context: 'user',
      en: 'Your card\'s security code is incorrect.',
      he: 'קוד האבטחה של הכרטיס שגוי.',
    },
    {
      key: 'stripe.errors.cardDeclined',
      context: 'user',
      en: 'Your card was declined.',
      he: 'הכרטיס שלך נדחה.',
    },
    {
      key: 'stripe.errors.processingError',
      context: 'user',
      en: 'An error occurred while processing your card. Try again later.',
      he: 'אירעה שגיאה בעיבוד הכרטיס. נסה שוב מאוחר יותר.',
    },
    {
      key: 'stripe.errors.cardNotSupported',
      context: 'user',
      en: 'Your card does not support this type of purchase.',
      he: 'הכרטיס שלך אינו תומך בסוג רכישה זה.',
    },
    {
      key: 'stripe.errors.insufficientFunds',
      context: 'user',
      en: 'Your card has insufficient funds.',
      he: 'אין מספיק כסף בכרטיס שלך.',
    },
    {
      key: 'stripe.errors.lostCard',
      context: 'user',
      en: 'Your card has been reported as lost.',
      he: 'הכרטיס שלך דווח כאבוד.',
    },
    {
      key: 'stripe.errors.stolenCard',
      context: 'user',
      en: 'Your card has been reported as stolen.',
      he: 'הכרטיס שלך דווח כגנוב.',
    },
    {
      key: 'stripe.errors.genericDecline',
      context: 'user',
      en: 'Your card was declined. Please contact your bank for more information.',
      he: 'הכרטיס שלך נדחה. אנא צור קשר עם הבנק שלך למידע נוסף.',
    },
    {
      key: 'stripe.errors.tryAgain',
      context: 'user',
      en: 'An error occurred. Please try again.',
      he: 'אירעה שגיאה. אנא נסה שוב.',
    },
    {
      key: 'stripe.errors.authenticationRequired',
      context: 'user',
      en: 'Your card requires authentication. Please complete the verification.',
      he: 'הכרטיס שלך דורש אימות. אנא השלם את האימות.',
    },
    {
      key: 'stripe.errors.rateLimitExceeded',
      context: 'user',
      en: 'Too many requests. Please wait a moment and try again.',
      he: 'יותר מדי בקשות. אנא המתן רגע ונסה שוב.',
    },
    // General card form labels
    {
      key: 'stripe.labels.cardNumber',
      context: 'user',
      en: 'Card Number',
      he: 'מספר כרטיס',
    },
    {
      key: 'stripe.labels.expiryDate',
      context: 'user',
      en: 'Expiry Date',
      he: 'תאריך תפוגה',
    },
    {
      key: 'stripe.labels.cvc',
      context: 'user',
      en: 'CVC',
      he: 'קוד CVC',
    },
    {
      key: 'stripe.labels.postalCode',
      context: 'user',
      en: 'Postal Code',
      he: 'מיקוד',
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
  console.log('\n✅ Stripe validation translations completed!');
}

addTranslations().catch(console.error);
