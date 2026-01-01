const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // English - Delete Dialog
  { lang: 'en', key: 'user.notifications.deleteDialog.title', value: 'Delete Notification?', ctx: 'user' },
  { lang: 'en', key: 'user.notifications.deleteDialog.description', value: 'Are you sure you want to delete this notification? This action cannot be undone.', ctx: 'user' },
  { lang: 'en', key: 'user.notifications.deleteDialog.cancel', value: 'Cancel', ctx: 'user' },
  { lang: 'en', key: 'user.notifications.deleteDialog.confirm', value: 'Delete', ctx: 'user' },

  // Hebrew - Delete Dialog
  { lang: 'he', key: 'user.notifications.deleteDialog.title', value: 'למחוק התראה?', ctx: 'user' },
  { lang: 'he', key: 'user.notifications.deleteDialog.description', value: 'האם אתה בטוח שברצונך למחוק התראה זו? לא ניתן לבטל פעולה זו.', ctx: 'user' },
  { lang: 'he', key: 'user.notifications.deleteDialog.cancel', value: 'ביטול', ctx: 'user' },
  { lang: 'he', key: 'user.notifications.deleteDialog.confirm', value: 'מחק', ctx: 'user' },
];

async function addTranslations() {
  console.log('Adding delete dialog translations...\n');

  try {
    // Get tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Delete existing translations with these keys first
    console.log('Cleaning up existing translations...');
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.deleteDialog.%');

    if (deleteError) {
      console.error('Error deleting existing translations:', deleteError);
    } else {
      console.log('✓ Cleaned up existing translations\n');
    }

    console.log(`\nInserting ${translations.length} translations...\n`);

    const records = translations.map(t => ({
      language_code: t.lang,
      translation_key: t.key,
      translation_value: t.value,
      context: t.ctx,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('translations')
      .insert(records);

    if (insertError) {
      console.error('Error inserting translations:', insertError);
      throw insertError;
    }

    console.log('✅ All delete dialog translations added successfully!');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

addTranslations();
