const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Reset password page - Title and subtitle
  { key: 'auth.reset.title', en: 'Reset your password', he: 'איפוס סיסמה' },
  { key: 'auth.reset.subtitle', en: "We'll send you an email with a link to reset your password", he: 'נשלח לך אימייל עם קישור לאיפוס הסיסמה' },

  // Form labels
  { key: 'auth.reset.email', en: 'Email address', he: 'כתובת אימייל' },

  // Buttons
  { key: 'auth.reset.sendButton', en: 'Send reset link', he: 'שלח קישור לאיפוס' },
  { key: 'auth.reset.sending', en: 'Sending...', he: 'שולח...' },
  { key: 'auth.reset.backToLogin', en: 'Back to login', he: 'חזור להתחברות' },

  // Success messages
  { key: 'auth.reset.successMessage', en: 'Check your email for a password reset link', he: 'בדוק את האימייל שלך לקישור איפוס סיסמה' },
  { key: 'auth.reset.emailSent', en: "We've sent an email to", he: 'שלחנו אימייל אל' },
  { key: 'auth.reset.withInstructions', en: 'with instructions to reset your password', he: 'עם הוראות לאיפוס הסיסמה שלך' },

  // Reset confirm page - Title and subtitle
  { key: 'auth.resetConfirm.title', en: 'Set New Password', he: 'הגדר סיסמה חדשה' },
  { key: 'auth.resetConfirm.subtitle', en: 'Enter your new password below', he: 'הזן את הסיסמה החדשה שלך למטה' },

  // Form labels
  { key: 'auth.resetConfirm.newPassword', en: 'New Password', he: 'סיסמה חדשה' },
  { key: 'auth.resetConfirm.confirmPassword', en: 'Confirm New Password', he: 'אמת סיסמה חדשה' },

  // Buttons
  { key: 'auth.resetConfirm.updateButton', en: 'Update Password', he: 'עדכן סיסמה' },

  // Success messages
  { key: 'auth.resetConfirm.successMessage', en: 'Password updated successfully!', he: 'הסיסמה עודכנה בהצלחה!' },
  { key: 'auth.resetConfirm.redirecting', en: 'Redirecting to login...', he: 'מפנה להתחברות...' },

  // Error messages
  { key: 'auth.resetConfirm.invalidLink', en: 'Invalid or expired reset link. Please request a new one.', he: 'קישור איפוס לא חוקי או שפג תוקפו. נא לבקש חדש.' },
  { key: 'auth.reset.errors.invalidEmail', en: 'Please enter a valid email address', he: 'נא להזין כתובת אימייל תקינה' },
  { key: 'auth.reset.errors.emailNotFound', en: 'No account found with this email address', he: 'לא נמצא חשבון עם כתובת אימייל זו' },
  { key: 'auth.reset.errors.unknown', en: 'An error occurred while sending reset link', he: 'אירעה שגיאה בעת שליחת קישור האיפוס' },

  // Common messages
  { key: 'auth.signup.passwordMismatch', en: 'Passwords do not match', he: 'הסיסמאות אינן תואמות' },
  { key: 'auth.signup.passwordTooShort', en: 'Password must be at least 8 characters', he: 'הסיסמה חייבת להכיל לפחות 8 תווים' },
  { key: 'auth.signup.passwordHint', en: 'At least 8 characters', he: 'לפחות 8 תווים' },
];

async function addTranslations() {
  console.log('Starting to add reset password translations...\n');

  // Get tenant ID
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
  console.log(`Using tenant ID: ${tenantId}\n`);

  let addedCount = 0;
  let updatedCount = 0;

  for (const translation of translations) {
    const { key, en, he } = translation;

    // Check if Hebrew translation exists
    const { data: existingHe } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'he')
      .eq('context', 'user');

    if (existingHe && existingHe.length > 0) {
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: he })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'he')
        .eq('context', 'user');

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Updated HE: ${key}`);
      } else {
        console.error(`Error updating HE for ${key}:`, updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: he,
          language_code: 'he',
          context: 'user'
        });

      if (!insertError) {
        addedCount++;
        console.log(`➕ Added HE: ${key}`);
      } else {
        console.error(`Error adding HE for ${key}:`, insertError.message);
      }
    }

    // Check if English translation exists
    const { data: existingEn } = await supabase
      .from('translations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('translation_key', key)
      .eq('language_code', 'en')
      .eq('context', 'user');

    if (existingEn && existingEn.length > 0) {
      const { error: updateError } = await supabase
        .from('translations')
        .update({ translation_value: en })
        .eq('tenant_id', tenantId)
        .eq('translation_key', key)
        .eq('language_code', 'en')
        .eq('context', 'user');

      if (!updateError) {
        updatedCount++;
        console.log(`✅ Updated EN: ${key}`);
      } else {
        console.error(`Error updating EN for ${key}:`, updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('translations')
        .insert({
          tenant_id: tenantId,
          translation_key: key,
          translation_value: en,
          language_code: 'en',
          context: 'user'
        });

      if (!insertError) {
        addedCount++;
        console.log(`➕ Added EN: ${key}`);
      } else {
        console.error(`Error adding EN for ${key}:`, insertError.message);
      }
    }
  }

  console.log(`\n✅ Completed!`);
  console.log(`   Added: ${addedCount} translations`);
  console.log(`   Updated: ${updatedCount} translations`);
}

addTranslations().catch(console.error);
