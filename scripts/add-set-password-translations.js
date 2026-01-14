const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Set Password Dialog - Admin
  { key: 'admin.users.actions.set_password', en: 'Set Password', he: 'הגדר סיסמה', context: 'admin' },
  { key: 'admin.users.setPassword.title', en: 'Set Password for {name}', he: 'הגדר סיסמה עבור {name}', context: 'admin' },
  { key: 'admin.users.setPassword.description', en: 'Manually set a new password for', he: 'הגדר ידנית סיסמה חדשה עבור', context: 'admin' },
  { key: 'admin.users.setPassword.warning', en: 'The user will be able to login with this new password immediately. Make sure to communicate the password securely.', he: 'המשתמש יוכל להתחבר עם הסיסמה החדשה באופן מיידי. וודא להעביר את הסיסמה בצורה מאובטחת.', context: 'admin' },
  { key: 'admin.users.setPassword.newPassword', en: 'New Password', he: 'סיסמה חדשה', context: 'admin' },
  { key: 'admin.users.setPassword.confirmPassword', en: 'Confirm Password', he: 'אימות סיסמה', context: 'admin' },
  { key: 'admin.users.setPassword.passwordPlaceholder', en: 'Enter new password (min 8 characters)', he: 'הזן סיסמה חדשה (מינימום 8 תווים)', context: 'admin' },
  { key: 'admin.users.setPassword.confirmPlaceholder', en: 'Re-enter password', he: 'הזן סיסמה שוב', context: 'admin' },
  { key: 'admin.users.setPassword.minLength', en: 'Password must be at least 8 characters long', he: 'הסיסמה חייבת להכיל לפחות 8 תווים', context: 'admin' },
  { key: 'admin.users.setPassword.mismatch', en: 'Passwords do not match', he: 'הסיסמאות אינן תואמות', context: 'admin' },
  { key: 'admin.users.setPassword.cancel', en: 'Cancel', he: 'ביטול', context: 'admin' },
  { key: 'admin.users.setPassword.confirm', en: 'Set Password', he: 'הגדר סיסמה', context: 'admin' },
  { key: 'admin.users.setPassword.successMessage', en: 'Password set successfully for {name}', he: 'הסיסמה הוגדרה בהצלחה עבור {name}', context: 'admin' },
  { key: 'admin.users.setPassword.errorMessage', en: 'Failed to set password', he: 'כשל בהגדרת הסיסמה', context: 'admin' },
];

async function addTranslations() {
  console.log('🌐 Adding set password translations...\n');

  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (tenantError || !tenants) {
    console.error('❌ Error fetching tenant:', tenantError);
    process.exit(1);
  }

  const tenantId = tenants.id;
  console.log(`Using tenant ID: ${tenantId}\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const translation of translations) {
    try {
      // Check English
      const { data: existingEn } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'en')
        .eq('context', translation.context);

      if (existingEn && existingEn.length > 0) {
        skipCount++;
      } else {
        const { error: enError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.en,
            language_code: 'en',
            context: translation.context,
          });

        if (enError) throw enError;
        successCount++;
      }

      // Check Hebrew
      const { data: existingHe } = await supabase
        .from('translations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('translation_key', translation.key)
        .eq('language_code', 'he')
        .eq('context', translation.context);

      if (existingHe && existingHe.length > 0) {
        skipCount++;
      } else {
        const { error: heError } = await supabase
          .from('translations')
          .insert({
            tenant_id: tenantId,
            translation_key: translation.key,
            translation_value: translation.he,
            language_code: 'he',
            context: translation.context,
          });

        if (heError) throw heError;
        successCount++;
      }
    } catch (err) {
      console.error(`✗ Error adding ${translation.key}:`, err.message);
    }
  }

  console.log('='.repeat(50));
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`⏭️  Skipped (already exist): ${skipCount}`);
  console.log('='.repeat(50));
}

addTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
