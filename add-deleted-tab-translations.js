const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const translations = [
  // English - Deleted tab
  { lang: 'en', key: 'user.notifications.tabs.deleted', value: 'Deleted', ctx: 'user' },
  { lang: 'en', key: 'user.notifications.stats.deleted', value: 'Deleted', ctx: 'user' },
  { lang: 'en', key: 'user.notifications.noDeletedNotifications', value: 'No deleted notifications', ctx: 'user' },

  // Hebrew - Deleted tab
  { lang: 'he', key: 'user.notifications.tabs.deleted', value: 'נמחקו', ctx: 'user' },
  { lang: 'he', key: 'user.notifications.stats.deleted', value: 'נמחקו', ctx: 'user' },
  { lang: 'he', key: 'user.notifications.noDeletedNotifications', value: 'אין התראות שנמחקו', ctx: 'user' },
];

async function addTranslations() {
  console.log('Adding deleted tab translations...\n');

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
    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.tabs.deleted');

    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.stats.deleted');

    await supabase
      .from('translations')
      .delete()
      .like('translation_key', 'user.notifications.noDeletedNotifications');

    console.log('✓ Cleaned up existing translations\n');

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

    console.log('✅ All deleted tab translations added successfully!');
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

addTranslations();
