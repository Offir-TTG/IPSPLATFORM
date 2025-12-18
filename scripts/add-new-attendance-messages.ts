import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const newTranslations = [
  {
    key: 'lms.attendance.selectFilter',
    en: 'Please select a program, course, or student to view attendance',
    he: 'אנא בחר תכנית, קורס או תלמיד כדי לצפות בנוכחות'
  },
  {
    key: 'lms.attendance.noStudentsFound',
    en: 'No students found for the selected filters',
    he: 'לא נמצאו תלמידים עבור המסננים שנבחרו'
  },
];

async function addNewMessages() {
  try {
    console.log('🚀 Adding new attendance messages...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');

    const tenantId = tenants.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Update existing translations or insert new ones
    for (const trans of newTranslations) {
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
    }

    // Also update the existing noLessonsFound message
    await supabase
      .from('translations')
      .update({
        translation_value: 'No lessons found for the selected filters',
        updated_at: new Date().toISOString()
      })
      .eq('translation_key', 'lms.attendance.noLessonsFound')
      .eq('language_code', 'en')
      .eq('tenant_id', tenantId);

    await supabase
      .from('translations')
      .update({
        translation_value: 'לא נמצאו שיעורים עבור המסננים שנבחרו',
        updated_at: new Date().toISOString()
      })
      .eq('translation_key', 'lms.attendance.noLessonsFound')
      .eq('language_code', 'he')
      .eq('tenant_id', tenantId);

    console.log('✓ Updated lms.attendance.noLessonsFound');

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addNewMessages();
