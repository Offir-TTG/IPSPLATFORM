const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // Login page - Title and subtitle
  { key: 'auth.login.title', en: 'Welcome Back', he: 'ברוכים השבים' },
  { key: 'auth.login.subtitle', en: 'Sign in to your account to continue', he: 'היכנס לחשבונך כדי להמשיך' },

  // Form labels
  { key: 'auth.login.email', en: 'Email', he: 'אימייל' },
  { key: 'auth.login.password', en: 'Password', he: 'סיסמה' },
  { key: 'auth.login.forgotPassword', en: 'Forgot password?', he: 'שכחת סיסמה?' },

  // Buttons
  { key: 'auth.login.button', en: 'Sign In', he: 'התחבר' },
  { key: 'auth.login.backToHome', en: 'Back to Home', he: 'חזור לדף הבית' },
  { key: 'common.loading', en: 'Loading...', he: 'טוען...' },

  // Error messages
  { key: 'auth.errors.invalidCredentials', en: 'Invalid email or password', he: 'אימייל או סיסמה שגויים' },
  { key: 'auth.errors.invalidEmailFormat', en: 'Please enter a valid email address', he: 'נא להזין כתובת אימייל תקינה' },
  { key: 'auth.errors.passwordTooShort', en: 'Password must be at least 6 characters', he: 'הסיסמה חייבת להכיל לפחות 6 תווים' },
  { key: 'auth.errors.emailNotConfirmed', en: 'Please verify your email address', he: 'נא לאמת את כתובת האימייל שלך' },
  { key: 'auth.errors.fieldsRequired', en: 'Email and password are required', he: 'אימייל וסיסמה הם שדות חובה' },
  { key: 'auth.errors.noAccess', en: 'You do not have access to this organization', he: 'אין לך גישה לארגון זה' },
  { key: 'auth.errors.tenantNotFound', en: 'Organization not found. Please contact support.', he: 'הארגון לא נמצא. נא ליצור קשר עם התמיכה.' },
  { key: 'auth.errors.verifyEmail', en: 'Please verify your email address before logging in', he: 'נא לאמת את כתובת האימייל שלך לפני ההתחברות' },
  { key: 'auth.errors.unknown', en: 'An error occurred during login', he: 'אירעה שגיאה במהלך ההתחברות' },

  // Sign up related (for consistency)
  { key: 'auth.login.noAccount', en: "Don't have an account?", he: 'אין לך חשבון?' },
  { key: 'auth.login.signupLink', en: 'Sign up now', he: 'הירשם עכשיו' },
];

async function addTranslations() {
  console.log('Starting to add login page translations...\n');

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
