import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const translations = [
  {
    key: 'common.info',
    en: 'Info',
    he: 'מידע'
  },
  {
    key: 'lms.attendance.noDataToSave',
    en: 'No attendance data to save',
    he: 'אין נתוני נוכחות לשמירה'
  },
];

async function addTranslations() {
  try {
    console.log('🚀 Adding info translations...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');

    const tenantId = tenants.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    for (const trans of translations) {
      // Delete existing if present
      await supabase
        .from('translations')
        .delete()
        .eq('translation_key', trans.key)
        .eq('tenant_id', tenantId);

      // Insert English
      await supabase.from('translations').insert({
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'en',
        translation_value: trans.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Insert Hebrew
      await supabase.from('translations').insert({
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'he',
        translation_value: trans.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      console.log(`✓ Added ${trans.key}`);
      console.log(`  EN: ${trans.en}`);
      console.log(`  HE: ${trans.he}`);
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addTranslations();
