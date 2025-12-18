import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const newTranslations = [
  { key: 'admin.attendance.searchPrograms', en: 'Search programs...', he: 'חפש תכניות...' },
  { key: 'admin.attendance.searchCourses', en: 'Search courses...', he: 'חפש קורסים...' },
  { key: 'admin.attendance.searchStudents', en: 'Search students...', he: 'חפש תלמידים...' },
];

async function addMissingTranslations() {
  try {
    console.log('🚀 Adding missing translations...');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');
    
    const tenantId = tenants.id;
    console.log(`✓ Found tenant: ${tenantId}`);

    for (const trans of newTranslations) {
      // Check if exists
      const { data: existing } = await supabase
        .from('translations')
        .select('translation_key')
        .eq('translation_key', trans.key)
        .eq('tenant_id', tenantId)
        .single();

      if (existing) {
        console.log(`⊘ Skipping ${trans.key} (already exists)`);
        continue;
      }

      // Insert English
      await supabase.from('translations').insert({
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'en',
        translation_value: trans.en,
        context: 'admin',
      });

      // Insert Hebrew
      await supabase.from('translations').insert({
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'he',
        translation_value: trans.he,
        context: 'admin',
      });

      console.log(`✓ Added ${trans.key}`);
    }

    console.log('✅ Done!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissingTranslations();
