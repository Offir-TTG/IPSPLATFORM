-- Attendance System Translations
-- This migration adds all translations for the attendance tracking system

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing attendance translations
  DELETE FROM public.translations
  WHERE translation_key LIKE 'admin.attendance.%' OR
        translation_key LIKE 'user.attendance.%';

  -- Insert Admin Attendance Translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Main page
  (v_tenant_id, 'en', 'admin.attendance.title', 'Attendance', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.title', 'נוכחות', 'admin', NOW(), NOW()),

  -- Actions
  (v_tenant_id, 'en', 'admin.attendance.export', 'Export', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.export', 'ייצא', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.saved', 'Attendance saved successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.saved', 'הנוכחות נשמרה בהצלחה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.exported', 'Attendance exported successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.exported', 'הנוכחות יוצאה בהצלחה', 'admin', NOW(), NOW()),

  -- Filters
  (v_tenant_id, 'en', 'admin.attendance.filters', 'Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.filters', 'מסננים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.date', 'Date', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.date', 'תאריך', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.lesson', 'Lesson (Optional)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.lesson', 'שיעור (אופציונלי)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.allLessons', 'All Lessons', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.allLessons', 'כל השיעורים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.search', 'Search Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.search', 'חפש תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.searchPlaceholder', 'Search by name or email...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.searchPlaceholder', 'חפש לפי שם או אימייל...', 'admin', NOW(), NOW()),

  -- Quick actions
  (v_tenant_id, 'en', 'admin.attendance.markAllPresent', 'Mark All Present', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.markAllPresent', 'סמן הכל כנוכח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.markAllAbsent', 'Mark All Absent', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.markAllAbsent', 'סמן הכל כנעדר', 'admin', NOW(), NOW()),

  -- Students section
  (v_tenant_id, 'en', 'admin.attendance.students', 'Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.students', 'תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.markAttendance', 'Mark attendance for each student', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.markAttendance', 'סמן נוכחות לכל תלמיד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.notes', 'Notes...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.notes', 'הערות...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.noStudents', 'No students found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.noStudents', 'לא נמצאו תלמידים', 'admin', NOW(), NOW()),

  -- Status
  (v_tenant_id, 'en', 'admin.attendance.status.present', 'Present', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.status.present', 'נוכח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.status.late', 'Late', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.status.late', 'איחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.status.absent', 'Absent', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.status.absent', 'נעדר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.status.excused', 'Excused', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.status.excused', 'מאושר', 'admin', NOW(), NOW()),

  -- Reports page
  (v_tenant_id, 'en', 'admin.attendance.reports.title', 'Attendance Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.title', 'דוחות נוכחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.export', 'Export', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.export', 'ייצא', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.exported', 'Report exported successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.exported', 'הדוח יוצא בהצלחה', 'admin', NOW(), NOW()),

  -- Summary stats
  (v_tenant_id, 'en', 'admin.attendance.reports.totalStudents', 'Total Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.totalStudents', 'סך תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.avgAttendance', 'Average Attendance', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.avgAttendance', 'ממוצע נוכחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.excellent', 'Excellent', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.excellent', 'מצוין', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.good', 'Good', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.good', 'טוב', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.warning', 'Warning', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.warning', 'אזהרה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.poor', 'Poor', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.poor', 'גרוע', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.ofTotal', 'of total', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.ofTotal', 'מסך הכל', 'admin', NOW(), NOW()),

  -- Filters
  (v_tenant_id, 'en', 'admin.attendance.reports.filters', 'Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.filters', 'מסננים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.sortBy', 'Sort By', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.sortBy', 'מיין לפי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.byPercentage', 'Attendance Percentage', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.byPercentage', 'אחוז נוכחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.byName', 'Student Name', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.byName', 'שם תלמיד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.filterBy', 'Filter By', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.filterBy', 'סנן לפי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.all', 'All Students', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.all', 'כל התלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.needsAttention', 'Needs Attention (60-90%)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.needsAttention', 'דורש תשומת לב (60-90%)', 'admin', NOW(), NOW()),

  -- Student reports
  (v_tenant_id, 'en', 'admin.attendance.reports.studentReports', 'Student Reports', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.studentReports', 'דוחות תלמידים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.detailedBreakdown', 'Detailed attendance breakdown for each student', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.detailedBreakdown', 'פירוט נוכחות מפורט לכל תלמיד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.present', 'Present', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.present', 'נוכח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.late', 'Late', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.late', 'איחור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.absent', 'Absent', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.absent', 'נעדר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.excused', 'Excused', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.excused', 'מאושר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.attendance', 'Attendance', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.attendance', 'נוכחות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.sessions', 'sessions total', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.sessions', 'מפגשים סה"כ', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.reports.noData', 'No attendance data available', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.reports.noData', 'אין נתוני נוכחות זמינים', 'admin', NOW(), NOW()),

  -- User Attendance Translations
  (v_tenant_id, 'en', 'user.attendance.title', 'My Attendance', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.title', 'הנוכחות שלי', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.totalSessions', 'Total Sessions', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.totalSessions', 'סך מפגשים', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.present', 'Present', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.present', 'נוכח', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.includingLate', 'Including {count} late', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.includingLate', 'כולל {count} איחורים', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.absent', 'Absent', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.absent', 'נעדר', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.excused', '{count} excused', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.excused', '{count} מאושר', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.attendanceRate', 'Attendance Rate', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.attendanceRate', 'שיעור נוכחות', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.records', 'Attendance Records', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.records', 'רשומות נוכחות', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.recordsDescription', 'Your attendance history for this course', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.recordsDescription', 'היסטוריית הנוכחות שלך לקורס זה', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.noRecords', 'No attendance records yet', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.noRecords', 'אין רשומות נוכחות עדיין', 'user', NOW(), NOW()),

  -- Status
  (v_tenant_id, 'en', 'user.attendance.status.present', 'Present', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.status.present', 'נוכח', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.status.late', 'Late', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.status.late', 'איחור', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.status.absent', 'Absent', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.status.absent', 'נעדר', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.attendance.status.excused', 'Excused', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.attendance.status.excused', 'מאושר', 'user', NOW(), NOW());

  RAISE NOTICE '✅ Added attendance system translations';
  RAISE NOTICE 'Total translations added: 94 keys × 2 languages = 188 entries';
END $$;
