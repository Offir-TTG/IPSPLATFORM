import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyNavTranslation() {
  console.log('🚀 Applying enrollments navigation translation...');

  try {
    // Get default tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .single();

    if (tenantError || !tenant) {
      throw new Error('Default tenant not found');
    }

    const tenantId = tenant.id;
    console.log(`✅ Found tenant: ${tenantId}`);

    // Insert navigation translations
    const translations = [
      { language_code: 'en', translation_key: 'admin.nav.enrollments', translation_value: 'Enrollments', category: 'admin', tenant_id: tenantId },
      { language_code: 'he', translation_key: 'admin.nav.enrollments', translation_value: 'רישומים', category: 'admin', tenant_id: tenantId },
    ];

    console.log('📝 Upserting navigation translations...');

    const { error } = await supabase
      .from('translations')
      .upsert(translations, {
        onConflict: 'translation_key,language_code,tenant_id',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }

    console.log('✅ Navigation translations applied successfully!');

    // Verify
    const { data: verifyData } = await supabase
      .from('translations')
      .select('*')
      .eq('translation_key', 'admin.nav.enrollments')
      .order('language_code');

    console.log('\n✅ Verified translations:');
    verifyData?.forEach(t => {
      console.log(`  ${t.language_code}: ${t.translation_value}`);
    });

  } catch (error) {
    console.error('❌ Error applying navigation translation:', error);
    process.exit(1);
  }
}

applyNavTranslation();
