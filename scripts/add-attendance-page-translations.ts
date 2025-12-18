import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // LMS Attendance Page
  { key: 'lms.attendance.title', en: 'Attendance', he: 'נוכחות' },
  { key: 'lms.attendance.filters', en: 'Filters', he: 'מסננים' },
  { key: 'lms.attendance.course', en: 'Course', he: 'קורס' },
  { key: 'lms.attendance.selectCourse', en: 'Select Course', he: 'בחר קורס' },
  { key: 'lms.attendance.date', en: 'Date', he: 'תאריך' },
  { key: 'lms.attendance.lesson', en: 'Lesson', he: 'שיעור' },
  { key: 'lms.attendance.selectLesson', en: 'Select Lesson', he: 'בחר שיעור' },
  { key: 'lms.attendance.lessonRequired', en: 'Please select a lesson', he: 'אנא בחר שיעור' },
  { key: 'lms.attendance.selectLessonFirst', en: 'Please select a lesson to mark attendance', he: 'אנא בחר שיעור כדי לסמן נוכחות' },
  { key: 'lms.attendance.selectLessonDescription', en: 'Choose a lesson from the filters above to view and mark student attendance', he: 'בחר שיעור מהמסננים למעלה כדי לצפות ולסמן נוכחות תלמידים' },
  { key: 'lms.attendance.searchCourse', en: 'Search course...', he: 'חפש קורס...' },
  { key: 'lms.attendance.searchLesson', en: 'Search lesson...', he: 'חפש שיעור...' },
  { key: 'lms.attendance.noCourseFound', en: 'No course found.', he: 'לא נמצא קורס.' },
  { key: 'lms.attendance.noLessonFound', en: 'No lesson found.', he: 'לא נמצא שיעור.' },
  { key: 'lms.attendance.search', en: 'Search Students', he: 'חפש תלמידים' },
  { key: 'lms.attendance.searchPlaceholder', en: 'Search by name or email...', he: 'חפש לפי שם או אימייל...' },
  { key: 'lms.attendance.markAllPresent', en: 'Mark All Present', he: 'סמן הכל כנוכחים' },
  { key: 'lms.attendance.markAllAbsent', en: 'Mark All Absent', he: 'סמן הכל כנעדרים' },
  { key: 'lms.attendance.students', en: 'Students', he: 'תלמידים' },
  { key: 'lms.attendance.markAttendance', en: 'Mark attendance for each student', he: 'סמן נוכחות לכל תלמיד' },
  { key: 'lms.attendance.notes', en: 'Notes...', he: 'הערות...' },
  { key: 'lms.attendance.noStudents', en: 'No students found', he: 'לא נמצאו תלמידים' },
  { key: 'lms.attendance.saved', en: 'Attendance saved successfully', he: 'הנוכחות נשמרה בהצלחה' },
  { key: 'lms.attendance.export', en: 'Export', he: 'ייצוא' },
  { key: 'lms.attendance.exported', en: 'Attendance exported successfully', he: 'הנוכחות יוצאה בהצלחה' },

  // Grid View
  { key: 'lms.attendance.grid', en: 'Attendance Grid', he: 'רשת נוכחות' },
  { key: 'lms.attendance.selectDate', en: 'Select Date', he: 'בחר תאריך' },
  { key: 'lms.attendance.legend', en: 'Legend', he: 'מקרא' },
  { key: 'lms.attendance.actions', en: 'Actions', he: 'פעולות' },
  { key: 'lms.attendance.lessons', en: 'Lessons', he: 'שיעורים' },
  { key: 'lms.attendance.noData', en: 'No students or lessons found for this course', he: 'לא נמצאו תלמידים או שיעורים לקורס זה' },
  { key: 'lms.attendance.student', en: 'Student', he: 'תלמיד' },
  { key: 'lms.attendance.subtitle', en: 'Mark attendance for all students and lessons', he: 'סמן נוכחות לכל התלמידים והשיעורים' },
  { key: 'lms.attendance.selectCourseOrProgram', en: 'Select Course or Program', he: 'בחר קורס או תכנית' },
  { key: 'lms.attendance.program', en: 'Program', he: 'תכנית' },
  { key: 'lms.attendance.selectProgram', en: 'Select Program', he: 'בחר תכנית' },
  { key: 'lms.attendance.chooseProgram', en: 'Choose a program', he: 'בחר תכנית' },
  { key: 'lms.attendance.chooseCourse', en: 'Choose a course', he: 'בחר קורס' },
  { key: 'lms.attendance.pleaseSelect', en: 'Please select a course or program to view attendance', he: 'אנא בחר קורס או תכנית כדי לצפות בנוכחות' },
  { key: 'lms.attendance.noLessonsFound', en: 'No lessons found for the selected course/program', he: 'לא נמצאו שיעורים לקורס/תכנית שנבחרו' },
  { key: 'lms.attendance.noStudentsEnrolled', en: 'No students are enrolled in this course/program', he: 'אין תלמידים רשומים לקורס/תכנית זו' },
  { key: 'lms.attendance.filters', en: 'Filters', he: 'מסננים' },
  { key: 'lms.attendance.allPrograms', en: 'All Programs', he: 'כל התכניות' },
  { key: 'lms.attendance.allCourses', en: 'All Courses', he: 'כל הקורסים' },
  { key: 'lms.attendance.allStudents', en: 'All Students', he: 'כל התלמידים' },
  { key: 'lms.attendance.searchPrograms', en: 'Search programs...', he: 'חפש תכניות...' },
  { key: 'lms.attendance.searchCourses', en: 'Search courses...', he: 'חפש קורסים...' },
  { key: 'lms.attendance.searchStudents', en: 'Search students...', he: 'חפש תלמידים...' },

  // Attendance Status
  { key: 'lms.attendance.status.present', en: 'Present', he: 'נוכח' },
  { key: 'lms.attendance.status.late', en: 'Late', he: 'איחור' },
  { key: 'lms.attendance.status.absent', en: 'Absent', he: 'נעדר' },
  { key: 'lms.attendance.status.excused', en: 'Excused', he: 'היעדרות מוצדקת' },
];

async function addAttendancePageTranslations() {
  try {
    console.log('🚀 Adding Attendance Page translations...\n');

    // Get the first tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    const tenantId = tenant.id;
    console.log(`✓ Found tenant: ${tenantId}\n`);

    // Delete existing translations to avoid duplicates
    const translationKeys = translations.map(t => t.key);
    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', translationKeys);

    if (deleteError) {
      console.error('Warning: Error deleting old translations:', deleteError.message);
    }

    // Prepare translation entries
    const translationEntries = translations.flatMap(translation => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: translation.key,
        translation_value: translation.en,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: translation.key,
        translation_value: translation.he,
        context: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Insert translations in batches
    const batchSize = 50;
    for (let i = 0; i < translationEntries.length; i += batchSize) {
      const batch = translationEntries.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('translations')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert translations batch: ${insertError.message}`);
      }
    }

    console.log('✅ Added Attendance Page translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translationEntries.length} entries\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addAttendancePageTranslations();
