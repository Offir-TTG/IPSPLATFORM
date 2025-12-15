/**
 * Script to apply enrollment reset dialog translations
 * Run with: npx tsx scripts/apply-reset-enrollment-translations.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const translations = [
  // Reset button
  { key: 'admin.enrollments.reset', en: 'Reset enrollment wizard', he: 'אפס את אשף ההרשמה' },

  // Reset dialog
  { key: 'admin.enrollments.reset.title', en: 'Reset Enrollment Wizard', he: 'אפס את אשף ההרשמה' },
  { key: 'admin.enrollments.reset.description', en: 'Reset the enrollment wizard for {user} to allow them to go through the steps again', he: 'אפס את אשף ההרשמה עבור {user} כדי לאפשר להם לעבור שוב על השלבים' },
  { key: 'admin.enrollments.reset.info', en: 'This will reset the enrollment status to "pending" and allow the user to restart the enrollment wizard.', he: 'פעולה זו תאפס את סטטוס ההרשמה ל"ממתין" ותאפשר למשתמש להתחיל מחדש את אשף ההרשמה.' },

  // Checkboxes
  { key: 'admin.enrollments.reset.resetSignature', en: 'Reset DocuSign signature status', he: 'אפס את סטטוס חתימת DocuSign' },
  { key: 'admin.enrollments.reset.resetPayment', en: 'Reset payment status (paid amount to 0)', he: 'אפס את סטטוס התשלום (סכום ששולם ל-0)' },
  { key: 'admin.enrollments.reset.resetProfile', en: 'Reset profile onboarding flags', he: 'אפס דגלי הכנסה לפרופיל' },
  { key: 'admin.enrollments.reset.always', en: 'always enabled', he: 'תמיד מופעל' },

  // Warning
  { key: 'admin.enrollments.reset.warning', en: 'Warning: Resetting payment will set paid_amount to 0. This cannot be undone!', he: 'אזהרה: איפוס התשלום יקבע את הסכום ששולם ל-0. לא ניתן לבטל פעולה זו!' },

  // Buttons
  { key: 'admin.enrollments.reset.button', en: 'Reset Enrollment', he: 'אפס הרשמה' },
  { key: 'admin.enrollments.reset.resetting', en: 'Resetting...', he: 'מאפס...' },

  // Toast messages
  { key: 'admin.enrollments.reset.success', en: 'Enrollment reset successfully', he: 'ההרשמה אופסה בהצלחה' },
  { key: 'admin.enrollments.reset.wizardInfo', en: 'User can now restart at: ', he: 'המשתמש יכול כעת להתחיל מחדש ב: ' },
  { key: 'admin.enrollments.reset.error', en: 'Failed to reset enrollment', he: 'נכשל באיפוס ההרשמה' },
];

async function applyTranslations() {
  console.log('🔄 Applying enrollment reset translations...\n');

  // First, delete existing reset translations
  const { error: deleteError } = await supabase
    .from('translations')
    .delete()
    .like('translation_key', 'admin.enrollments.reset%');

  if (deleteError) {
    console.error('❌ Error deleting old translations:', deleteError);
    process.exit(1);
  }

  console.log('✅ Deleted old reset translations\n');

  // Insert new translations
  let successCount = 0;
  let errorCount = 0;

  for (const trans of translations) {
    // Insert English
    const { error: enError } = await supabase
      .from('translations')
      .insert({
        translation_key: trans.key,
        language_code: 'en',
        translation_value: trans.en,
        context: 'admin',
        tenant_id: null
      });

    if (enError) {
      console.error(`❌ Error inserting EN for ${trans.key}:`, enError.message);
      errorCount++;
    } else {
      successCount++;
    }

    // Insert Hebrew
    const { error: heError } = await supabase
      .from('translations')
      .insert({
        translation_key: trans.key,
        language_code: 'he',
        translation_value: trans.he,
        context: 'admin',
        tenant_id: null
      });

    if (heError) {
      console.error(`❌ Error inserting HE for ${trans.key}:`, heError.message);
      errorCount++;
    } else {
      successCount++;
    }

    console.log(`✅ ${trans.key}`);
    console.log(`   EN: ${trans.en}`);
    console.log(`   HE: ${trans.he}\n`);
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully inserted: ${successCount} translations`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }
  console.log('\n🎉 Done!');
}

applyTranslations().catch(console.error);
