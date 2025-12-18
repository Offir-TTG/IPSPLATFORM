import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateTranslations() {
  try {
    console.log('🚀 Migrating attendance translations from admin.attendance.* to lms.attendance.*\n');

    // Get the first tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('No tenant found');
    }

    const tenantId = tenant.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Get all translations with admin.attendance.* keys
    const { data: oldTranslations, error: fetchError } = await supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'admin.attendance.%');

    if (fetchError) {
      throw new Error(`Failed to fetch translations: ${fetchError.message}`);
    }

    if (!oldTranslations || oldTranslations.length === 0) {
      console.log('⊘ No admin.attendance.* translations found to migrate');
      process.exit(0);
    }

    console.log(`Found ${oldTranslations.length} translations to migrate\n`);

    // Create new translations with lms.attendance.* keys
    const newTranslations = oldTranslations.map(trans => ({
      tenant_id: trans.tenant_id,
      translation_key: trans.translation_key.replace('admin.attendance.', 'lms.attendance.'),
      language_code: trans.language_code,
      translation_value: trans.translation_value,
      context: 'admin', // Keep context as 'admin' due to database constraint
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert new translations
    const { error: insertError } = await supabase
      .from('translations')
      .insert(newTranslations);

    if (insertError) {
      throw new Error(`Failed to insert new translations: ${insertError.message}`);
    }

    console.log('✅ Created new lms.attendance.* translations');
    console.log(`   Total: ${newTranslations.length} entries\n`);

    // Delete old admin.attendance.* translations
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'admin.attendance.%');

    if (deleteError) {
      console.error('⚠️  Warning: Failed to delete old translations:', deleteError.message);
    } else {
      console.log('✅ Deleted old admin.attendance.* translations\n');
    }

    // Show sample of migrated keys
    console.log('Sample of migrated keys:');
    const uniqueKeys = [...new Set(newTranslations.map(t => t.translation_key))];
    uniqueKeys.slice(0, 10).forEach(key => {
      console.log(`  - ${key}`);
    });

    if (uniqueKeys.length > 10) {
      console.log(`  ... and ${uniqueKeys.length - 10} more`);
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

migrateTranslations();
