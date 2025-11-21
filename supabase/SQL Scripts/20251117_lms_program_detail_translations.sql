-- ============================================================================
-- LMS PROGRAM DETAIL PAGE TRANSLATIONS
-- Adds Hebrew translations for LMS program detail page
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant (for single-tenant setup, or adjust as needed)
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing Hebrew translations for LMS program detail to avoid duplicates
  DELETE FROM public.translations
  WHERE language_code = 'he'
    AND translation_key LIKE 'lms.program_detail.%';

  -- Insert Hebrew translations for LMS program detail page
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
  VALUES
    -- Page header
    (v_tenant_id, 'he', 'lms.program_detail.back_to_programs', 'חזרה לתוכניות', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.untitled_program', 'תוכנית ללא שם', 'admin', NOW(), NOW()),

    -- Status badges
    (v_tenant_id, 'he', 'lms.program_detail.status_active', 'פעיל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.status_inactive', 'לא פעיל', 'admin', NOW(), NOW()),

    -- Tab labels
    (v_tenant_id, 'he', 'lms.program_detail.tab_courses', 'קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.tab_students', 'סטודנטים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.tab_instructor_access', 'גישת מדריכים', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COURSES TAB
    -- ========================================================================

    -- Courses tab - Header
    (v_tenant_id, 'he', 'lms.program_detail.courses_title', 'קורסי תוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.courses_description', 'נהל אילו קורסים נכללים בתוכנית זו', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.courses_add', 'הוסף קורס', 'admin', NOW(), NOW()),

    -- Courses tab - Empty state
    (v_tenant_id, 'he', 'lms.program_detail.courses_empty', 'עדיין לא נוספו קורסים לתוכנית זו', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.courses_add_first', 'הוסף קורס ראשון', 'admin', NOW(), NOW()),

    -- Courses tab - List
    (v_tenant_id, 'he', 'lms.program_detail.course_required', 'חובה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_optional', 'אופציונלי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_make_optional', 'הפוך לאופציונלי', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_make_required', 'הפוך לחובה', 'admin', NOW(), NOW()),

    -- Add course dialog (bulk selection)
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_title', 'הוסף קורסים לתוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_description', 'בחר קורס אחד או יותר להוספה לתוכנית זו', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.search_courses', 'חפש קורסים...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.select_all', 'בחר הכל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.deselect_all', 'בטל בחירת הכל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.courses_selected', '{count} קורסים נבחרו', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.no_courses_found', 'לא נמצאו קורסים התואמים לחיפוש', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.no_available_courses', 'אין קורסים זמינים להוספה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_button', 'הוסף קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.add_courses_count', 'הוסף {count} קורסים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.courses_added', '{count} קורסים נוספו לתוכנית', 'admin', NOW(), NOW()),

    -- Remove course dialog
    (v_tenant_id, 'he', 'lms.program_detail.remove_course_title', 'הסר קורס?', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.remove_course_description', 'האם אתה בטוח שברצונך להסיר את "{title}" מתוכנית זו? הקורס עצמו לא יימחק.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.remove_course_button', 'הסר', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- STUDENTS TAB
    -- ========================================================================

    -- Students tab - Header
    (v_tenant_id, 'he', 'lms.program_detail.students_title', 'סטודנטים רשומים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.students_description', 'נהל רישומי סטודנטים בתוכנית זו', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.students_enroll', 'רשום סטודנט', 'admin', NOW(), NOW()),

    -- Students tab - Empty state
    (v_tenant_id, 'he', 'lms.program_detail.students_empty', 'עדיין אין סטודנטים רשומים בתוכנית זו', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.students_enroll_first', 'רשום סטודנט ראשון', 'admin', NOW(), NOW()),

    -- Students tab - List
    (v_tenant_id, 'he', 'lms.program_detail.student_enrolled', 'נרשם', 'admin', NOW(), NOW()),

    -- Enrollment status options
    (v_tenant_id, 'he', 'lms.program_detail.enrollment_active', 'פעיל', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enrollment_pending', 'בהמתנה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enrollment_suspended', 'מושעה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enrollment_completed', 'הושלם', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enrollment_dropped', 'נשר', 'admin', NOW(), NOW()),

    -- Enroll student dialog
    (v_tenant_id, 'he', 'lms.program_detail.enroll_student_title', 'רשום סטודנט לתוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enroll_student_description', 'חפש ובחר סטודנט לרישום ב-{name}', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enroll_search_label', 'חפש סטודנטים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enroll_search_placeholder', 'חפש לפי שם או אימייל...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enroll_no_users', 'לא נמצאו משתמשים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enroll_role_student', 'סטודנט', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enroll_role_instructor', 'מדריך', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enroll_button', 'רשום סטודנט', 'admin', NOW(), NOW()),

    -- Unenroll student dialog
    (v_tenant_id, 'he', 'lms.program_detail.unenroll_student_title', 'בטל רישום סטודנט?', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.unenroll_student_description', 'האם אתה בטוח שברצונך לבטל את רישום {firstName} {lastName} מתוכנית זו? סטטוס הרישום שלהם ישונה ל"נשר".', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.unenroll_button', 'בטל רישום', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- INSTRUCTOR ACCESS TAB
    -- ========================================================================

    -- Instructor bridge - Header
    (v_tenant_id, 'he', 'lms.program_detail.bridge_title', 'קישור גשר למדריכים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_description', 'צור קישור קבוע למדריכים לגישה לסשנים חיים ב-Zoom', 'admin', NOW(), NOW()),

    -- Bridge link exists
    (v_tenant_id, 'he', 'lms.program_detail.bridge_url_label', 'כתובת URL של גשר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_copy_tooltip', 'העתק ללוח', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_open_tooltip', 'פתח בכרטיסייה חדשה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_slug', 'מזהה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_created', 'נוצר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_last_used', 'שימוש אחרון', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_usage_count', 'מספר שימושים', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_instructor', 'מדריך', 'admin', NOW(), NOW()),

    -- Bridge how it works
    (v_tenant_id, 'he', 'lms.program_detail.bridge_how_title', 'איך זה עובד', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_how_point1', 'קישור זה מנתב אוטומטית מדריכים לשיעור הנוכחי או הבא המתוזמן שלהם', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_how_point2', 'המערכת בודקת זמני שיעור בחלון של 15 דקות לפני ו-30 דקות אחרי ההתחלה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_how_point3', 'אם סשן חי, מדריכים מופנים אוטומטית לכתובת ה-URL להתחלת Zoom', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_how_point4', 'הקישור קבוע וניתן לשמור אותו בסימניות לגישה קלה', 'admin', NOW(), NOW()),

    -- Bridge empty state
    (v_tenant_id, 'he', 'lms.program_detail.bridge_empty_title', 'לא נוצר קישור גשר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_empty_description', 'צור קישור גשר קבוע למדריכים לגישה לסשנים חיים שלהם. הקישור יכוון אותם אוטומטית לפגישת Zoom הנכונה.', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_create_button', 'צור קישור גשר', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_creating', 'יוצר קישור...', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- COMMON BUTTONS AND ACTIONS
    -- ========================================================================

    (v_tenant_id, 'he', 'lms.program_detail.cancel', 'ביטול', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.loading', 'טוען...', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.saving', 'שומר...', 'admin', NOW(), NOW()),

    -- ========================================================================
    -- TOAST MESSAGES
    -- ========================================================================

    -- Success messages
    (v_tenant_id, 'he', 'lms.program_detail.toast_success', 'הצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.toast_error', 'שגיאה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.toast_copied', 'הועתק!', 'admin', NOW(), NOW()),

    -- Course actions
    (v_tenant_id, 'he', 'lms.program_detail.course_added', 'הקורס נוסף לתוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_removed', 'הקורס הוסר מהתוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_updated', 'הקורס עודכן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_add_error', 'נכשל להוסיף קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_remove_error', 'נכשל להסיר קורס', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.course_update_error', 'נכשל לעדכן קורס', 'admin', NOW(), NOW()),

    -- Student actions
    (v_tenant_id, 'he', 'lms.program_detail.student_enrolled_success', 'הסטודנט נרשם בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.student_unenrolled', 'הסטודנט הוסר מהתוכנית', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enrollment_status_updated', 'סטטוס הרישום עודכן', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.student_enroll_error', 'נכשל לרשום סטודנט', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.student_unenroll_error', 'נכשל לבטל רישום סטודנט', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.enrollment_status_error', 'נכשל לעדכן סטטוס רישום', 'admin', NOW(), NOW()),

    -- Bridge actions
    (v_tenant_id, 'he', 'lms.program_detail.bridge_toast_created', 'קישור גשר למדריכים נוצר בהצלחה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_copied', 'קישור גשר הועתק ללוח', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.bridge_create_error', 'נכשל ליצור קישור גשר', 'admin', NOW(), NOW()),

    -- Loading errors
    (v_tenant_id, 'he', 'lms.program_detail.program_not_found', 'התוכנית לא נמצאה', 'admin', NOW(), NOW()),
    (v_tenant_id, 'he', 'lms.program_detail.load_error', 'נכשל לטעון תוכנית', 'admin', NOW(), NOW());

  -- Show success message
  RAISE NOTICE 'Successfully added/updated % Hebrew translations for LMS program detail page', (
    SELECT COUNT(*)
    FROM translations
    WHERE translation_key LIKE 'lms.program_detail.%'
      AND language_code = 'he'
      AND tenant_id = v_tenant_id
  );
END $$;
