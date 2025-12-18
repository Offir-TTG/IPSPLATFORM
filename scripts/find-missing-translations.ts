import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All keys used in the attendance page
const requiredKeys = [
  'lms.attendance.saved',
  'lms.attendance.title',
  'lms.attendance.subtitle',
  'lms.attendance.filters',
  'lms.attendance.program',
  'lms.attendance.allPrograms',
  'lms.attendance.searchPrograms',
  'lms.attendance.course',
  'lms.attendance.allCourses',
  'lms.attendance.searchCourses',
  'lms.attendance.student',
  'lms.attendance.allStudents',
  'lms.attendance.searchStudents',
  'lms.attendance.date',
  'lms.attendance.pleaseSelect',
  'lms.attendance.noLessonsFound',
  'lms.attendance.noStudentsEnrolled',
  'lms.attendance.legend',
  'lms.attendance.grid',
  'lms.attendance.students',
  'lms.attendance.lessons',
  'lms.attendance.markAllPresent',
  'lms.attendance.markAllAbsent',
  'lms.attendance.actions',
  'lms.attendance.status.present',
  'lms.attendance.status.late',
  'lms.attendance.status.absent',
  'lms.attendance.status.excused',
];

async function findMissing() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    const tenantId = tenants?.id;

    // Get all lms.attendance.* translations
    const { data: translations } = await supabase
      .from('translations')
      .select('translation_key, language_code')
      .eq('tenant_id', tenantId)
      .ilike('translation_key', 'lms.attendance.%');

    const existingKeys = new Set(translations?.map(t => t.translation_key) || []);

    console.log('Missing translation keys:\n');
    const missing = requiredKeys.filter(key => !existingKeys.has(key));

    if (missing.length === 0) {
      console.log('✅ All required keys exist!');
    } else {
      missing.forEach(key => {
        console.log(`  ❌ ${key}`);
      });
      console.log(`\nTotal missing: ${missing.length}`);
    }

    console.log(`\nTotal required: ${requiredKeys.length}`);
    console.log(`Total existing: ${existingKeys.size}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findMissing();
