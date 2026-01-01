const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding info message translations...\n');

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

    // Delete existing if any
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .eq('translation_key', 'user.notifications.info.noUnreadNotifications');

    if (deleteError) {
      console.warn('Warning during delete:', deleteError.message);
    }

    const translations = [
      { lang: 'en', key: 'user.notifications.info.noUnreadNotifications', value: 'No unread notifications to mark', ctx: 'user' },
      { lang: 'he', key: 'user.notifications.info.noUnreadNotifications', value: 'אין התראות שלא נקראו לסימון', ctx: 'user' },
    ];

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

    console.log('\n✅ Info message translations added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTranslations();
