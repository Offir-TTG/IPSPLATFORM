const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTranslations() {
  console.log('Adding user grades and attendance translations...\n');

  try {
    // Get tenant ID
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .order('created_at')
      .limit(1);

    if (tenantError || !tenants || tenants.length === 0) {
      throw new Error('No tenant found');
    }

    const tenantId = tenants[0].id;
    console.log('Using tenant:', tenantId);

    // Delete existing translations
    const keysToDelete = [
      // Grades translations
      'user.grades.title',
      'user.grades.overallGrade',
      'user.grades.categories.title',
      'user.grades.categories.weight',
      'user.grades.assignments',
      'user.grades.assignments.title',
      'user.grades.pointsEarned',
      'user.grades.totalPoints',
      'user.grades.gradedOn',
      'user.grades.feedback',
      'user.grades.notGraded',
      'user.grades.excused',
      'user.grades.empty.title',
      'user.grades.empty.description',
      'user.grades.error.load',

      // Attendance translations
      'user.attendance.title',
      'user.attendance.attendanceRate',
      'user.attendance.totalSessions',
      'user.attendance.present',
      'user.attendance.late',
      'user.attendance.absent',
      'user.attendance.excused',
      'user.attendance.includingLate',
      'user.attendance.records',
      'user.attendance.recordsDescription',
      'user.attendance.noRecords',
      'user.attendance.status.present',
      'user.attendance.status.absent',
      'user.attendance.status.late',
      'user.attendance.status.excused',

      // Common
      'common.back',
      'common.loading',
      'common.error',
    ];

    const { error: deleteError } = await supabase
      .from('translations')
      .delete()
      .in('translation_key', keysToDelete);

    if (deleteError) {
      console.log('Note: Could not delete existing translations:', deleteError.message);
    } else {
      console.log('✓ Deleted existing translations');
    }

    // Insert new translations
    const translations = [
      // ===== GRADES TRANSLATIONS - English =====
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.title', translation_value: 'My Grades', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.overallGrade', translation_value: 'Overall Grade', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.categories.title', translation_value: 'Grade Categories', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.categories.weight', translation_value: 'Weight', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.assignments', translation_value: 'Assignments', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.assignments.title', translation_value: 'Graded Assignments', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.pointsEarned', translation_value: 'Points Earned', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.totalPoints', translation_value: 'Total Points', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.gradedOn', translation_value: 'Graded on', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.feedback', translation_value: 'Feedback', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.notGraded', translation_value: 'Not Yet Graded', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.excused', translation_value: 'Excused', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.empty.title', translation_value: 'No Grades Yet', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.empty.description', translation_value: 'Your grades will appear here once assignments are graded', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.grades.error.load', translation_value: 'Failed to load grades', context: 'user' },

      // ===== GRADES TRANSLATIONS - Hebrew =====
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.title', translation_value: 'הציונים שלי', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.overallGrade', translation_value: 'ציון כללי', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.categories.title', translation_value: 'קטגוריות ציונים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.categories.weight', translation_value: 'משקל', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.assignments', translation_value: 'מטלות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.assignments.title', translation_value: 'מטלות מדורגות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.pointsEarned', translation_value: 'נקודות שהושגו', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.totalPoints', translation_value: 'סך הנקודות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.gradedOn', translation_value: 'דורג בתאריך', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.feedback', translation_value: 'משוב', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.notGraded', translation_value: 'טרם דורג', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.excused', translation_value: 'פטור', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.empty.title', translation_value: 'אין ציונים עדיין', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.empty.description', translation_value: 'הציונים שלך יופיעו כאן לאחר שהמטלות ידורגו', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.grades.error.load', translation_value: 'טעינת הציונים נכשלה', context: 'user' },

      // ===== ATTENDANCE TRANSLATIONS - English =====
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.title', translation_value: 'My Attendance', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.attendanceRate', translation_value: 'Attendance Rate', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.totalSessions', translation_value: 'Total Sessions', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.present', translation_value: 'Present', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.late', translation_value: 'Late', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.absent', translation_value: 'Absent', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.excused', translation_value: 'Excused', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.includingLate', translation_value: 'including late arrivals', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.records', translation_value: 'Attendance Records', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.recordsDescription', translation_value: 'Your attendance history for all sessions', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.noRecords', translation_value: 'No attendance records found', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.status.present', translation_value: 'Present', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.status.absent', translation_value: 'Absent', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.status.late', translation_value: 'Late', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'user.attendance.status.excused', translation_value: 'Excused', context: 'user' },

      // ===== ATTENDANCE TRANSLATIONS - Hebrew =====
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.title', translation_value: 'הנוכחות שלי', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.attendanceRate', translation_value: 'אחוז נוכחות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.totalSessions', translation_value: 'סך המפגשים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.present', translation_value: 'נוכח', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.late', translation_value: 'איחר', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.absent', translation_value: 'נעדר', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.excused', translation_value: 'פטור', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.includingLate', translation_value: 'כולל איחורים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.records', translation_value: 'רשומות נוכחות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.recordsDescription', translation_value: 'היסטוריית הנוכחות שלך לכל המפגשים', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.noRecords', translation_value: 'לא נמצאו רשומות נוכחות', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.status.present', translation_value: 'נוכח', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.status.absent', translation_value: 'נעדר', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.status.late', translation_value: 'איחר', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'user.attendance.status.excused', translation_value: 'פטור', context: 'user' },

      // ===== COMMON TRANSLATIONS - English =====
      { tenant_id: tenantId, language_code: 'en', translation_key: 'common.back', translation_value: 'Back', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'common.loading', translation_value: 'Loading...', context: 'user' },
      { tenant_id: tenantId, language_code: 'en', translation_key: 'common.error', translation_value: 'Error', context: 'user' },

      // ===== COMMON TRANSLATIONS - Hebrew =====
      { tenant_id: tenantId, language_code: 'he', translation_key: 'common.back', translation_value: 'חזרה', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'common.loading', translation_value: 'טוען...', context: 'user' },
      { tenant_id: tenantId, language_code: 'he', translation_key: 'common.error', translation_value: 'שגיאה', context: 'user' },
    ];

    const { error: insertError } = await supabase
      .from('translations')
      .insert(translations);

    if (insertError) {
      throw insertError;
    }

    console.log('✓ Added grades translations (English & Hebrew)');
    console.log('✓ Added attendance translations (English & Hebrew)');
    console.log('✓ Added common translations (English & Hebrew)');
    console.log('\n✅ All translations added successfully!');
    console.log('\nTranslations Summary:');
    console.log('  📊 Grades: My Grades / הציונים שלי');
    console.log('  📅 Attendance: My Attendance / הנוכחות שלי');
    console.log('  ✅ Present / נוכח');
    console.log('  ❌ Absent / נעדר');
    console.log('  ⏰ Late / איחר');
    console.log('  📝 Feedback / משוב');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

addTranslations();
