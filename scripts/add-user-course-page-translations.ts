import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const translations = [
  // Error messages
  { key: 'user.courses.error.load', en: 'Failed to load course', he: 'נכשל בטעינת הקורס' },
  { key: 'user.courses.error.notFound', en: 'Course not found', he: 'הקורס לא נמצא' },
  { key: 'user.courses.error.updateProgress', en: 'Failed to update progress', he: 'נכשל בעדכון ההתקדמות' },

  // Common actions
  { key: 'common.back', en: 'Back to Courses', he: 'חזרה לקורסים' },
  { key: 'common.min', en: 'min', he: 'דק' },

  // Instructor
  { key: 'user.courses.instructor', en: 'Instructor', he: 'מרצה' },

  // Content section
  { key: 'user.courses.content.title', en: 'Course Content', he: 'תוכן הקורס' },
  { key: 'user.courses.content.empty', en: 'No content available yet', he: 'אין תוכן זמין עדיין' },
  { key: 'user.courses.content.noLessons', en: 'No lessons available', he: 'אין שיעורים זמינים' },
  { key: 'user.courses.content.topics', en: 'Topics', he: 'נושאים' },

  // Module/Lesson labels
  { key: 'user.courses.lesson', en: 'lesson', he: 'שיעור' },
  { key: 'user.courses.lessons', en: 'lessons', he: 'שיעורים' },
  { key: 'user.courses.topic', en: 'topic', he: 'נושא' },
  { key: 'user.courses.topics', en: 'topics', he: 'נושאים' },
  { key: 'user.courses.optional', en: 'Optional', he: 'אופציונלי' },
  { key: 'user.courses.required', en: 'Required', he: 'חובה' },

  // Lesson status
  { key: 'user.courses.status.completed', en: 'Completed', he: 'הושלם' },
  { key: 'user.courses.status.inProgress', en: 'In Progress', he: 'בתהליך' },
  { key: 'user.courses.status.notStarted', en: 'Not Started', he: 'לא התחיל' },

  // Lesson actions
  { key: 'user.courses.markComplete', en: 'Mark as complete', he: 'סמן כהושלם' },
  { key: 'user.courses.markIncomplete', en: 'Mark as incomplete', he: 'סמן כלא הושלם' },
  { key: 'user.courses.markedComplete', en: 'Lesson marked as complete', he: 'השיעור סומן כהושלם' },
  { key: 'user.courses.markedIncomplete', en: 'Lesson marked as incomplete', he: 'השיעור סומן כלא הושלם' },
  { key: 'user.courses.markAllComplete', en: 'Mark All Complete', he: 'סמן הכל כהושלם' },
  { key: 'user.courses.markAllCompleteDesc', en: 'Toggle all lessons at once', he: 'שנה את כל השיעורים בבת אחת' },
  { key: 'user.courses.allLessonsMarkedComplete', en: 'All lessons marked as complete', he: 'כל השיעורים סומנו כהושלמו' },
  { key: 'user.courses.allLessonsMarkedIncomplete', en: 'All lessons marked as incomplete', he: 'כל השיעורים סומנו כלא הושלמו' },

  // Zoom meeting section
  { key: 'user.courses.liveMeeting', en: 'Live Meeting', he: 'פגישה חיה' },
  { key: 'user.courses.recording', en: 'Recording', he: 'הקלטה' },
  { key: 'user.courses.zoomMeeting', en: 'Zoom Meeting', he: 'פגישת Zoom' },
  { key: 'user.courses.clickToJoin', en: 'Click the button below to join the live meeting', he: 'לחץ על הכפתור למטה כדי להצטרף לפגישה החיה' },
  { key: 'user.courses.passcode', en: 'Passcode', he: 'קוד גישה' },
  { key: 'user.courses.joinMeeting', en: 'Join Meeting', he: 'הצטרף לפגישה' },
  { key: 'user.courses.meetingEnded', en: 'Meeting has ended', he: 'הפגישה הסתיימה' },
  { key: 'user.courses.recordingNotReady', en: 'The recording for this session is not available yet. Please check back later after the session has ended.', he: 'ההקלטה של המפגש עדיין לא זמינה. אנא בדוק שוב לאחר שהמפגש יסתיים.' },

  // Topic content types
  { key: 'user.courses.openPdf', en: 'Open PDF', he: 'פתח PDF' },
  { key: 'user.courses.download', en: 'Download File', he: 'הורד קובץ' },
  { key: 'user.courses.whiteboard', en: 'Whiteboard Content', he: 'תוכן לוח' },
  { key: 'user.courses.openWhiteboard', en: 'Open Whiteboard', he: 'פתח לוח' },
  { key: 'user.courses.whiteboardNotAvailable', en: 'Whiteboard content will be available during the live session', he: 'תוכן הלוח יהיה זמין במהלך המפגש החי' },

  // Progress card
  { key: 'user.courses.progress.title', en: 'Your Progress', he: 'ההתקדמות שלך' },
  { key: 'user.courses.progress.complete', en: 'Complete', he: 'הושלם' },
  { key: 'user.courses.progress.completed', en: 'Completed', he: 'הושלמו' },
  { key: 'user.courses.progress.inProgress', en: 'In Progress', he: 'בתהליך' },
  { key: 'user.courses.progress.remaining', en: 'Remaining', he: 'נותרו' },

  // Statistics/Overview card
  { key: 'user.courses.statistics.title', en: 'Course Overview', he: 'סקירת הקורס' },
  { key: 'user.courses.statistics.students', en: 'Students', he: 'תלמידים' },
  { key: 'user.courses.statistics.modules', en: 'Modules', he: 'מודולים' },
  { key: 'user.courses.statistics.lessons', en: 'Lessons', he: 'שיעורים' },
  { key: 'user.courses.statistics.topics', en: 'Topics', he: 'נושאים' },
  { key: 'user.courses.statistics.studyTime', en: 'Study Time', he: 'זמן לימוד' },
  { key: 'user.courses.statistics.materials', en: 'Materials', he: 'חומרים' },

  // Quick Actions
  { key: 'user.courses.quickActions', en: 'Quick Actions', he: 'פעולות מהירות' },
  { key: 'user.courses.viewGrades', en: 'View Grades', he: 'צפה בציונים' },
  { key: 'user.courses.viewAttendance', en: 'View Attendance', he: 'צפה בנוכחות' },

  // Materials section
  { key: 'user.courses.materials.title', en: 'Course Materials', he: 'חומרי הקורס' },
  { key: 'user.courses.materials.view', en: 'View', he: 'צפה' },
  { key: 'user.courses.materials.download', en: 'Download', he: 'הורד' },
  { key: 'user.courses.materials.previewNotAvailable', en: 'Preview not available for this file type', he: 'תצוגה מקדימה לא זמינה עבור סוג קובץ זה' },
  { key: 'user.courses.materials.videoNotSupported', en: 'Your browser does not support the video tag.', he: 'הדפדפן שלך אינו תומך בתגית הווידאו.' },

  // Material categories
  { key: 'user.courses.materials.category.syllabus', en: 'Syllabus', he: 'סילבוס' },
  { key: 'user.courses.materials.category.lectureNotes', en: 'Lecture Notes', he: 'הרצאות' },
  { key: 'user.courses.materials.category.assignments', en: 'Assignments', he: 'משימות' },
  { key: 'user.courses.materials.category.assignment', en: 'Assignment', he: 'משימה' },
  { key: 'user.courses.materials.category.readings', en: 'Readings', he: 'קריאה' },
  { key: 'user.courses.materials.category.reading', en: 'Reading', he: 'קריאה' },
  { key: 'user.courses.materials.category.slides', en: 'Slides', he: 'מצגות' },
  { key: 'user.courses.materials.category.slide', en: 'Slide', he: 'מצגת' },
  { key: 'user.courses.materials.category.handouts', en: 'Handouts', he: 'דפי עזר' },
  { key: 'user.courses.materials.category.handout', en: 'Handout', he: 'דף עזר' },
  { key: 'user.courses.materials.category.resources', en: 'Resources', he: 'משאבים' },
  { key: 'user.courses.materials.category.resource', en: 'Resource', he: 'משאב' },
  { key: 'user.courses.materials.category.exercises', en: 'Exercises', he: 'תרגילים' },
  { key: 'user.courses.materials.category.exercise', en: 'Exercise', he: 'תרגיל' },
  { key: 'user.courses.materials.category.references', en: 'References', he: 'אסמכתאות' },
  { key: 'user.courses.materials.category.reference', en: 'Reference', he: 'אסמכתא' },
  { key: 'user.courses.materials.category.other', en: 'Other', he: 'אחר' },

  // Fullscreen modal
  { key: 'user.courses.minimize', en: 'Minimize', he: 'מזער' },
];

async function addUserCoursePageTranslations() {
  try {
    console.log('🚀 Adding user course page translations...\n');

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
      .in('translation_key', translationKeys)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Warning: Error deleting old translations:', deleteError.message);
    } else {
      console.log('✓ Cleaned up existing translations\n');
    }

    // Prepare translation entries
    const translationEntries = translations.flatMap(translation => [
      {
        tenant_id: tenantId,
        language_code: 'en',
        translation_key: translation.key,
        translation_value: translation.en,
        context: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        tenant_id: tenantId,
        language_code: 'he',
        translation_key: translation.key,
        translation_value: translation.he,
        context: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Insert translations in batches
    const batchSize = 100;
    for (let i = 0; i < translationEntries.length; i += batchSize) {
      const batch = translationEntries.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('translations')
        .insert(batch);

      if (insertError) {
        throw new Error(`Failed to insert translations batch ${i / batchSize + 1}: ${insertError.message}`);
      }
      console.log(`✓ Inserted batch ${i / batchSize + 1} (${batch.length} entries)`);
    }

    console.log('\n✅ Successfully added user course page translations');
    console.log(`Total translations added: ${translations.length} keys × 2 languages = ${translationEntries.length} entries\n`);

    // Display summary by category
    console.log('📊 Summary by category:');
    console.log('  - Error messages: 3');
    console.log('  - Common actions: 2');
    console.log('  - Content section: 4');
    console.log('  - Module/Lesson labels: 6');
    console.log('  - Lesson status: 11');
    console.log('  - Zoom meeting: 8');
    console.log('  - Topic content: 5');
    console.log('  - Progress card: 5');
    console.log('  - Statistics/Overview: 7');
    console.log('  - Quick Actions: 3');
    console.log('  - Materials section: 5');
    console.log('  - Material categories: 17');
    console.log('  - Fullscreen modal: 1\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addUserCoursePageTranslations();
