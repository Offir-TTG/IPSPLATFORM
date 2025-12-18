import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const missingTranslations = [
  { key: 'lms.attendance.subtitle', en: 'Mark attendance for all students and lessons', he: 'סמן נוכחות לכל התלמידים והשיעורים' },
  { key: 'lms.attendance.program', en: 'Program', he: 'תכנית' },
  { key: 'lms.attendance.allPrograms', en: 'All Programs', he: 'כל התכניות' },
  { key: 'lms.attendance.allCourses', en: 'All Courses', he: 'כל הקורסים' },
  { key: 'lms.attendance.student', en: 'Student', he: 'תלמיד' },
  { key: 'lms.attendance.allStudents', en: 'All Students', he: 'כל התלמידים' },
  { key: 'lms.attendance.pleaseSelect', en: 'Please select a course or program to view attendance', he: 'אנא בחר קורס או תכנית כדי לצפות בנוכחות' },
  { key: 'lms.attendance.noLessonsFound', en: 'No lessons found for the selected course/program', he: 'לא נמצאו שיעורים לקורס/תכנית שנבחרו' },
  { key: 'lms.attendance.noStudentsEnrolled', en: 'No students are enrolled in this course/program', he: 'אין תלמידים רשומים לקורס/תכנית זו' },
  { key: 'lms.attendance.legend', en: 'Legend', he: 'מקרא' },
  { key: 'lms.attendance.grid', en: 'Attendance Grid', he: 'רשת נוכחות' },
  { key: 'lms.attendance.lessons', en: 'Lessons', he: 'שיעורים' },
  { key: 'lms.attendance.actions', en: 'Actions', he: 'פעולות' },
  { key: 'lms.attendance.status.present', en: 'Present', he: 'נוכח' },
  { key: 'lms.attendance.status.late', en: 'Late', he: 'איחור' },
  { key: 'lms.attendance.status.absent', en: 'Absent', he: 'נעדר' },
  { key: 'lms.attendance.status.excused', en: 'Excused', he: 'היעדרות מוצדקת' },
];

async function addMissing() {
  try {
    console.log('🚀 Adding missing attendance translations...\n');

    const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenants) throw new Error('No tenant found');

    const tenantId = tenants.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    const entries = missingTranslations.flatMap(trans => [
      {
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'en',
        translation_value: trans.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        translation_key: trans.key,
        language_code: 'he',
        translation_value: trans.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const { error: insertError } = await supabase
      .from('translations')
      .insert(entries);

    if (insertError) {
      throw new Error(`Failed to insert: ${insertError.message}`);
    }

    console.log(`✅ Added ${missingTranslations.length} keys × 2 languages = ${entries.length} entries\n`);

    console.log('Added keys:');
    missingTranslations.forEach(trans => {
      console.log(`  - ${trans.key}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissing();
