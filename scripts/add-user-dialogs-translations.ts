import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Password Reset Dialog
  { key: 'admin.users.passwordReset.title', en: 'Reset Password for {name}?', he: 'איפוס סיסמה עבור {name}?' },
  { key: 'admin.users.passwordReset.description', en: 'This will send a password reset email to', he: 'פעולה זו תשלח אימייל איפוס סיסמה אל' },
  { key: 'admin.users.passwordReset.warning', en: 'The user will receive a link to create a new password. This action cannot be undone.', he: 'המשתמש יקבל קישור ליצירת סיסמה חדשה. לא ניתן לבטל פעולה זו.' },
  { key: 'admin.users.passwordReset.cancel', en: 'Cancel', he: 'ביטול' },
  { key: 'admin.users.passwordReset.sendEmail', en: 'Send Email', he: 'שלח אימייל' },
  { key: 'admin.users.passwordReset.sending', en: 'Sending...', he: 'שולח...' },
  { key: 'admin.users.passwordReset.successMessage', en: 'Password reset email sent to {email}', he: 'אימייל איפוס סיסמה נשלח אל {email}' },
  { key: 'admin.users.passwordReset.errorMessage', en: 'Failed to send password reset email', he: 'נכשל בשליחת אימייל איפוס סיסמה' },

  // Deactivate User Dialog
  { key: 'admin.users.deactivate.activateTitle', en: 'Activate {name}?', he: 'הפעל את {name}?' },
  { key: 'admin.users.deactivate.deactivateTitle', en: 'Deactivate {name}?', he: 'השבת את {name}?' },
  { key: 'admin.users.deactivate.activateDescription', en: 'This user will regain access to the platform and all active courses.', he: 'משתמש זה יקבל שוב גישה לפלטפורמה ולכל הקורסים הפעילים.' },
  { key: 'admin.users.deactivate.deactivateWarning', en: 'This user will:', he: 'משתמש זה:' },
  { key: 'admin.users.deactivate.loseAccess', en: 'Lose access to the platform', he: 'יאבד גישה לפלטפורמה' },
  { key: 'admin.users.deactivate.removedFromCourses', en: 'Be removed from active courses', he: 'יוסר מקורסים פעילים' },
  { key: 'admin.users.deactivate.keepData', en: 'Keep all historical data', he: 'ישמור את כל הנתונים ההיסטוריים' },
  { key: 'admin.users.deactivate.reasonLabel', en: 'Reason (optional)', he: 'סיבה (אופציונלי)' },
  { key: 'admin.users.deactivate.reasonPlaceholderActivate', en: 'Reason for activation...', he: 'סיבה להפעלה...' },
  { key: 'admin.users.deactivate.reasonPlaceholderDeactivate', en: 'Reason for deactivation...', he: 'סיבה להשבתה...' },
  { key: 'admin.users.deactivate.cancel', en: 'Cancel', he: 'ביטול' },
  { key: 'admin.users.deactivate.activate', en: 'Activate', he: 'הפעל' },
  { key: 'admin.users.deactivate.deactivate', en: 'Deactivate', he: 'השבת' },
  { key: 'admin.users.deactivate.activating', en: 'Activating...', he: 'מפעיל...' },
  { key: 'admin.users.deactivate.deactivating', en: 'Deactivating...', he: 'משבית...' },
  { key: 'admin.users.deactivate.successActivated', en: 'User activated successfully', he: 'המשתמש הופעל בהצלחה' },
  { key: 'admin.users.deactivate.successDeactivated', en: 'User deactivated successfully', he: 'המשתמש הושבת בהצלחה' },
  { key: 'admin.users.deactivate.errorMessage', en: 'Failed to update user status', he: 'נכשל בעדכון סטטוס המשתמש' },
];

async function addUserDialogsTranslations() {
  try {
    console.log('🚀 Adding user dialogs translations...\n');

    // Get the first tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    const tenantId = tenant.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Delete existing translations to avoid duplicates
    const translationKeys = translations.map(t => t.key);
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', translationKeys)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Warning: Error deleting old translations:', deleteError.message);
    } else {
      console.log('✓ Cleaned up existing translations\n');
    }

    // Prepare translation entries
    const translationEntries = translations.flatMap(translation => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: translation.key,
        translation_value: translation.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: translation.key,
        translation_value: translation.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Insert translations in batches
    const batchSize = 100;
    for (let i = 0; i < translationEntries.length; i += batchSize) {
      const batch = translationEntries.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('translations')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert translations batch ${i / batchSize + 1}: ${insertError.message}`);
      }
      console.log(`✓ Inserted batch ${i / batchSize + 1} (${batch.length} entries)`);
    }

    console.log('\n✅ Successfully added user dialogs translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translationEntries.length} entries\n`);

    // Display summary by category
    console.log('📊 Summary by category:');
    console.log('  - Password Reset Dialog: 8 keys');
    console.log('  - Deactivate User Dialog: 18 keys\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addUserDialogsTranslations();
