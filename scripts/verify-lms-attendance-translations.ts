import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyTranslations() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const tenantId = tenants?.id;

    // Check for lms.attendance.* translations
    const { data: lmsTranslations } = await supabase
      .from('translations')
      .select('translation_key, language_code, translation_value')
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'lms.attendance.%')
      .order('translation_key');

    console.log('✅ LMS Attendance translations (lms.attendance.*):');
    console.log(`   Total: ${lmsTranslations?.length || 0} entries\n`);

    // Check for any remaining admin.attendance.* translations
    const { data: adminTranslations } = await supabase
      .from('translations')
      .select('translation_key')
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'admin.attendance.%');

    if (adminTranslations && adminTranslations.length > 0) {
      console.log('⚠️  Warning: Found remaining admin.attendance.* translations:');
      console.log(`   Total: ${adminTranslations.length} entries`);
    } else {
      console.log('✅ No admin.attendance.* translations found (migration complete)');
    }

    // Show sample of lms.attendance.* keys
    const uniqueKeys = [...new Set(lmsTranslations?.map(t => t.translation_key))];
    console.log('\nSample lms.attendance.* keys:');
    uniqueKeys.slice(0, 10).forEach(key => {
      const enTrans = lmsTranslations?.find(t => t.translation_key === key && t.language_code === 'en');
      console.log(`  - ${key}: "${enTrans?.translation_value}"`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyTranslations();
