import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAllTranslations() {
  try {
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (!tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // All translations needed
    const translations = [
      // Main page
      { key: 'admin.attendance.title', en: 'Attendance', he: 'נוכחות' },
      { key: 'admin.attendance.export', en: 'Export', he: 'ייצא' },
      { key: 'admin.attendance.saved', en: 'Attendance saved successfully', he: 'הנוכחות נשמרה בהצלחה' },
      { key: 'admin.attendance.exported', en: 'Attendance exported successfully', he: 'הנוכחות יוצאה בהצלחה' },

      // Filters
      { key: 'admin.attendance.program', en: 'Program', he: 'תוכנית' },
      { key: 'admin.attendance.allPrograms', en: 'All Programs', he: 'כל התוכניות' },
      { key: 'admin.attendance.selectProgram', en: 'Select program...', he: 'בחר תוכנית...' },
      { key: 'admin.attendance.noProgramsFound', en: 'No programs found', he: 'לא נמצאו תוכניות' },

      { key: 'admin.attendance.course', en: 'Course', he: 'קורס' },
      { key: 'admin.attendance.allCourses', en: 'All Courses', he: 'כל הקורסים' },
      { key: 'admin.attendance.selectCourse', en: 'Select course...', he: 'בחר קורס...' },
      { key: 'admin.attendance.noCoursesFound', en: 'No courses found', he: 'לא נמצאו קורסים' },

      { key: 'admin.attendance.date', en: 'Date', he: 'תאריך' },
      { key: 'admin.attendance.lesson', en: 'Lesson', he: 'שיעור' },
      { key: 'admin.attendance.allLessons', en: 'All Lessons', he: 'כל השיעורים' },

      { key: 'admin.attendance.search', en: 'Search Students', he: 'חפש תלמידים' },
      { key: 'admin.attendance.searchPlaceholder', en: 'Search by name or email...', he: 'חפש לפי שם או אימייל...' },

      // Quick actions
      { key: 'admin.attendance.markAllPresent', en: 'Mark All Present', he: 'סמן הכל כנוכח' },
      { key: 'admin.attendance.markAllAbsent', en: 'Mark All Absent', he: 'סמן הכל כנעדר' },
      { key: 'admin.attendance.clearAll', en: 'Clear All', he: 'נקה הכל' },

      // Students section
      { key: 'admin.attendance.noStudents', en: 'No students found', he: 'לא נמצאו תלמידים' },
      { key: 'admin.attendance.grid', en: 'Attendance Grid', he: 'טבלת נוכחות' },
      { key: 'admin.attendance.students', en: 'students', he: 'תלמידים' },
      { key: 'admin.attendance.lessons', en: 'lessons', he: 'שיעורים' },
      { key: 'admin.attendance.studentName', en: 'Student Name', he: 'שם תלמיד' },
      { key: 'admin.attendance.markAttendance', en: 'Mark attendance for each student', he: 'סמן נוכחות לכל תלמיד' },
      { key: 'admin.attendance.notes', en: 'Notes...', he: 'הערות...' },

      // Status
      { key: 'admin.attendance.status.present', en: 'Present', he: 'נוכח' },
      { key: 'admin.attendance.status.late', en: 'Late', he: 'איחור' },
      { key: 'admin.attendance.status.absent', en: 'Absent', he: 'נעדר' },
      { key: 'admin.attendance.status.excused', en: 'Excused', he: 'מאושר' },
    ];

    // Delete existing translations
    const keys = translations.map(t => t.key);
    await supabase
      .from('translations')
      .delete()
      .in('translation_key', keys);

    console.log('Deleted old translations');

    // Insert new translations
    const translationsToInsert = translations.flatMap(t => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: t.key,
        translation_value: t.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: t.key,
        translation_value: t.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    const { error } = await supabase
      .from('translations')
      .insert(translationsToInsert);

    if (error) {
      console.error('Error inserting translations:', error);
      throw error;
    }

    console.log('✅ Successfully added all attendance translations');
    console.log(`Total: ${translations.length} keys × 2 languages = ${translationsToInsert.length} entries`);

  } catch (error) {
    console.error('Failed to add translations:', error);
    process.exit(1);
  }
}

addAllTranslations();
