import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyTranslations() {
  try {
    console.log('🔍 Verifying attendance translations...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');
    
    const tenantId = tenants.id;
    console.log(`✓ Tenant: ${tenantId}\n`);

    const keysToCheck = [
      'admin.attendance.filters',
      'admin.attendance.searchPrograms',
      'admin.attendance.searchCourses',
      'admin.attendance.searchStudents',
      'admin.attendance.allPrograms',
      'admin.attendance.allCourses',
      'admin.attendance.allStudents',
    ];

    for (const key of keysToCheck) {
      const { data, error } = await supabase
        .from('translations')
        .select('language, value')
        .eq('key', key)
        .eq('tenant_id', tenantId);

      if (error) {
        console.log(`❌ ${key}: ERROR - ${error.message}`);
      } else if (!data || data.length === 0) {
        console.log(`❌ ${key}: MISSING`);
      } else {
        const en = data.find(t => t.language === 'en')?.value || 'N/A';
        const he = data.find(t => t.language === 'he')?.value || 'N/A';
        console.log(`✓ ${key}:`);
        console.log(`  EN: ${en}`);
        console.log(`  HE: ${he}`);
      }
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyTranslations();
