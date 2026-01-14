// Add test dialog translations to database
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
  // Test Dialog
  { key: 'triggers.test.title', en: 'Test Email Trigger', he: 'בדיקת טריגר דוא"ל' },
  { key: 'triggers.test.description', en: 'Enter the email address where you want to receive the test email.', he: 'הזן את כתובת הדוא"ל שבה ברצונך לקבל את דוא"ל הבדיקה.' },
  { key: 'triggers.test.productionRecipient', en: 'Production recipient:', he: 'נמען בייצור:' },
  { key: 'triggers.test.productionNote', en: 'In production, this email would be sent to the address above. For testing, you can send it to any email.', he: 'בייצור, דוא"ל זה יישלח לכתובת למעלה. לצורך בדיקה, ניתן לשלוח אותו לכל דוא"ל.' },
  { key: 'triggers.test.emailLabel', en: 'Test Email Address', he: 'כתובת דוא"ל לבדיקה' },
  { key: 'triggers.test.emailPlaceholder', en: 'your.email@example.com', he: 'your.email@example.com' },
  { key: 'triggers.test.emailRequired', en: 'Email address is required', he: 'כתובת דוא"ל נדרשת' },
  { key: 'triggers.test.emailInvalid', en: 'Please enter a valid email address', he: 'אנא הזן כתובת דוא"ל תקינה' },
  { key: 'triggers.test.emailHint', en: 'The test email will be sent to this address with a [TEST] prefix in the subject.', he: 'דוא"ל הבדיקה יישלח לכתובת זו עם קידומת [TEST] בנושא.' },
  { key: 'triggers.test.send', en: 'Send Test Email', he: 'שלח דוא"ל בדיקה' },
  { key: 'triggers.test.sending', en: 'Sending...', he: 'שולח...' },
  { key: 'triggers.test.failed', en: 'Failed to send test email', he: 'שליחת דוא"ל הבדיקה נכשלה' },
  { key: 'emails.triggers.testEmailSent', en: 'Test email sent to your inbox! Would be sent to: ', he: 'דוא"ל בדיקה נשלח לתיבת הדואר שלך! יישלח אל: ' },
];

async function addTranslations() {
  console.log('Adding test dialog translations...\n');

  let added = 0;
  let updated = 0;
  let errors = 0;

  for (const trans of translations) {
    // Add English translation
    const { error: enError } = await supabase
      .from('translations')
      .upsert({
        tenant_id: null,
        translation_key: trans.key,
        language_code: 'en',
        translation_value: trans.en,
        context: 'admin',
      }, {
        onConflict: 'translation_key,language_code,context',
        ignoreDuplicates: false,
      });

    if (enError) {
      console.error(`❌ Error adding EN for ${trans.key}:`, enError.message);
      errors++;
    } else {
      added++;
    }

    // Add Hebrew translation
    const { error: heError } = await supabase
      .from('translations')
      .upsert({
        tenant_id: null,
        translation_key: trans.key,
        language_code: 'he',
        translation_value: trans.he,
        context: 'admin',
      }, {
        onConflict: 'translation_key,language_code,context',
        ignoreDuplicates: false,
      });

    if (heError) {
      console.error(`❌ Error adding HE for ${trans.key}:`, heError.message);
      errors++;
    } else {
      added++;
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
