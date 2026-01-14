-- ============================================================================
-- LMS Translations Migration (CORRECTED)
-- ============================================================================
-- Adds translation entries for the new LMS section in the admin sidebar
-- Uses translation_keys and translations tables (not ui_text_config/ui_text_values)
-- ============================================================================

-- Step 1: Insert all keys into translation_keys table
INSERT INTO public.translation_keys (key, context, default_value, description)
VALUES
  -- Navigation
  ('admin.nav.learning', 'admin', 'Learning', 'LMS section title in admin sidebar'),
  ('admin.nav.lms_courses', 'admin', 'LMS Courses', 'LMS Courses menu item in admin sidebar'),

  -- Course List Page
  ('lms.courses.title', 'admin', 'Courses', 'Course list page title'),
  ('lms.courses.subtitle', 'admin', 'Manage your courses, modules, and lessons', 'Course list page subtitle'),
  ('lms.courses.create', 'admin', 'Create Course', 'Create course button text'),
  ('lms.courses.search_placeholder', 'admin', 'Search courses...', 'Search courses placeholder'),
  ('lms.courses.filter_by_status', 'admin', 'Filter by status', 'Filter by status placeholder'),
  ('lms.courses.all_courses', 'admin', 'All Courses', 'All courses filter option'),
  ('lms.courses.active', 'admin', 'Active', 'Active courses filter option'),
  ('lms.courses.inactive', 'admin', 'Inactive', 'Inactive courses filter option'),
  ('lms.courses.loading', 'admin', 'Loading courses...', 'Loading courses message'),
  ('lms.courses.no_courses', 'admin', 'No courses found', 'Empty state message'),
  ('lms.courses.get_started', 'admin', 'Get started by creating your first course', 'Empty state description'),
  ('lms.courses.manage', 'admin', 'Manage Course', 'Manage course button text'),
  ('lms.courses.duplicate', 'admin', 'Duplicate', 'Duplicate course action'),
  ('lms.courses.delete', 'admin', 'Delete', 'Delete course action'),
  ('lms.courses.edit', 'admin', 'Edit Course', 'Edit course action'),
  ('lms.courses.activate', 'admin', 'Activate', 'Activate course action'),
  ('lms.courses.deactivate', 'admin', 'Deactivate', 'Deactivate course action'),
  ('lms.courses.no_instructor', 'admin', 'No instructor', 'No instructor assigned message'),
  ('lms.courses.create_dialog_title', 'admin', 'Create New Course', 'Create course dialog title'),
  ('lms.courses.create_dialog_description', 'admin', 'Enter the course details below. You can add modules and lessons after creating the course.', 'Create course dialog description'),
  ('lms.courses.course_title', 'admin', 'Course Title', 'Course title field label'),
  ('lms.courses.course_title_placeholder', 'admin', 'e.g., Introduction to Programming', 'Course title placeholder'),
  ('lms.courses.description', 'admin', 'Description', 'Description field label'),
  ('lms.courses.description_placeholder', 'admin', 'Course description...', 'Description placeholder'),
  ('lms.courses.program', 'admin', 'Program', 'Program field label'),
  ('lms.courses.select_program', 'admin', 'Select a program', 'Select program placeholder'),
  ('lms.courses.no_programs', 'admin', 'No programs available', 'No programs available message'),
  ('lms.courses.program_help', 'admin', 'Select the program this course belongs to', 'Program field help text'),
  ('lms.courses.start_date', 'admin', 'Start Date', 'Start date field label'),
  ('lms.courses.end_date', 'admin', 'End Date', 'End date field label'),
  ('lms.courses.activate_immediately', 'admin', 'Activate course immediately', 'Activate immediately checkbox label'),
  ('lms.courses.cancel', 'admin', 'Cancel', 'Cancel button text'),
  ('lms.courses.creating', 'admin', 'Creating...', 'Creating state text'),
  ('lms.courses.delete_dialog_title', 'admin', 'Delete Course', 'Delete dialog title'),
  ('lms.courses.delete_dialog_description', 'admin', 'Are you sure you want to delete "{title}"? This will also delete all modules, lessons, and student progress. This action cannot be undone.', 'Delete dialog description'),
  ('lms.courses.deleting', 'admin', 'Deleting...', 'Deleting state text'),

  -- Course Builder
  ('lms.builder.title', 'admin', 'Course Builder', 'Course builder page title'),
  ('lms.builder.back', 'admin', 'Back', 'Back button text'),
  ('lms.builder.save', 'admin', 'Save Changes', 'Save changes button text'),
  ('lms.builder.preview', 'admin', 'Preview', 'Preview button text'),
  ('lms.builder.structure', 'admin', 'Course Structure', 'Course structure section title'),
  ('lms.builder.add', 'admin', 'Add', 'Add button text'),
  ('lms.builder.details', 'admin', 'Course Details', 'Course details tab title'),
  ('lms.builder.settings', 'admin', 'Settings', 'Settings tab title')
ON CONFLICT (key) DO UPDATE SET
  context = EXCLUDED.context,
  default_value = EXCLUDED.default_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Step 2: Insert English translations
INSERT INTO public.translations (translation_key, language_code, translation_value, context)
VALUES
  -- Navigation
  ('admin.nav.learning', 'en', 'Learning', 'admin'),
  ('admin.nav.lms_courses', 'en', 'LMS Courses', 'admin'),

  -- Course List Page
  ('lms.courses.title', 'en', 'Courses', 'admin'),
  ('lms.courses.subtitle', 'en', 'Manage your courses, modules, and lessons', 'admin'),
  ('lms.courses.create', 'en', 'Create Course', 'admin'),
  ('lms.courses.search_placeholder', 'en', 'Search courses...', 'admin'),
  ('lms.courses.filter_by_status', 'en', 'Filter by status', 'admin'),
  ('lms.courses.all_courses', 'en', 'All Courses', 'admin'),
  ('lms.courses.active', 'en', 'Active', 'admin'),
  ('lms.courses.inactive', 'en', 'Inactive', 'admin'),
  ('lms.courses.loading', 'en', 'Loading courses...', 'admin'),
  ('lms.courses.no_courses', 'en', 'No courses found', 'admin'),
  ('lms.courses.get_started', 'en', 'Get started by creating your first course', 'admin'),
  ('lms.courses.manage', 'en', 'Manage Course', 'admin'),
  ('lms.courses.duplicate', 'en', 'Duplicate', 'admin'),
  ('lms.courses.delete', 'en', 'Delete', 'admin'),
  ('lms.courses.edit', 'en', 'Edit Course', 'admin'),
  ('lms.courses.activate', 'en', 'Activate', 'admin'),
  ('lms.courses.deactivate', 'en', 'Deactivate', 'admin'),
  ('lms.courses.no_instructor', 'en', 'No instructor', 'admin'),
  ('lms.courses.create_dialog_title', 'en', 'Create New Course', 'admin'),
  ('lms.courses.create_dialog_description', 'en', 'Enter the course details below. You can add modules and lessons after creating the course.', 'admin'),
  ('lms.courses.course_title', 'en', 'Course Title', 'admin'),
  ('lms.courses.course_title_placeholder', 'en', 'e.g., Introduction to Programming', 'admin'),
  ('lms.courses.description', 'en', 'Description', 'admin'),
  ('lms.courses.description_placeholder', 'en', 'Course description...', 'admin'),
  ('lms.courses.program', 'en', 'Program', 'admin'),
  ('lms.courses.select_program', 'en', 'Select a program', 'admin'),
  ('lms.courses.no_programs', 'en', 'No programs available', 'admin'),
  ('lms.courses.program_help', 'en', 'Select the program this course belongs to', 'admin'),
  ('lms.courses.start_date', 'en', 'Start Date', 'admin'),
  ('lms.courses.end_date', 'en', 'End Date', 'admin'),
  ('lms.courses.activate_immediately', 'en', 'Activate course immediately', 'admin'),
  ('lms.courses.cancel', 'en', 'Cancel', 'admin'),
  ('lms.courses.creating', 'en', 'Creating...', 'admin'),
  ('lms.courses.delete_dialog_title', 'en', 'Delete Course', 'admin'),
  ('lms.courses.delete_dialog_description', 'en', 'Are you sure you want to delete "{title}"? This will also delete all modules, lessons, and student progress. This action cannot be undone.', 'admin'),
  ('lms.courses.deleting', 'en', 'Deleting...', 'admin'),

  -- Course Builder
  ('lms.builder.title', 'en', 'Course Builder', 'admin'),
  ('lms.builder.back', 'en', 'Back', 'admin'),
  ('lms.builder.save', 'en', 'Save Changes', 'admin'),
  ('lms.builder.preview', 'en', 'Preview', 'admin'),
  ('lms.builder.structure', 'en', 'Course Structure', 'admin'),
  ('lms.builder.add', 'en', 'Add', 'admin'),
  ('lms.builder.details', 'en', 'Course Details', 'admin'),
  ('lms.builder.settings', 'en', 'Settings', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  context = EXCLUDED.context,
  updated_at = NOW();

-- Step 3: Insert Hebrew translations
INSERT INTO public.translations (translation_key, language_code, translation_value, context)
VALUES
  -- Navigation
  ('admin.nav.learning', 'he', 'למידה', 'admin'),
  ('admin.nav.lms_courses', 'he', 'קורסי LMS', 'admin'),

  -- Course List Page
  ('lms.courses.title', 'he', 'קורסים', 'admin'),
  ('lms.courses.subtitle', 'he', 'נהל את הקורסים, המודולים והשיעורים שלך', 'admin'),
  ('lms.courses.create', 'he', 'צור קורס', 'admin'),
  ('lms.courses.search_placeholder', 'he', 'חפש קורסים...', 'admin'),
  ('lms.courses.filter_by_status', 'he', 'סנן לפי סטטוס', 'admin'),
  ('lms.courses.all_courses', 'he', 'כל הקורסים', 'admin'),
  ('lms.courses.active', 'he', 'פעיל', 'admin'),
  ('lms.courses.inactive', 'he', 'לא פעיל', 'admin'),
  ('lms.courses.loading', 'he', 'טוען קורסים...', 'admin'),
  ('lms.courses.no_courses', 'he', 'לא נמצאו קורסים', 'admin'),
  ('lms.courses.get_started', 'he', 'התחל ביצירת הקורס הראשון שלך', 'admin'),
  ('lms.courses.manage', 'he', 'נהל קורס', 'admin'),
  ('lms.courses.duplicate', 'he', 'שכפל', 'admin'),
  ('lms.courses.delete', 'he', 'מחק', 'admin'),
  ('lms.courses.edit', 'he', 'ערוך קורס', 'admin'),
  ('lms.courses.activate', 'he', 'הפעל', 'admin'),
  ('lms.courses.deactivate', 'he', 'השבת', 'admin'),
  ('lms.courses.no_instructor', 'he', 'אין מדריך', 'admin'),
  ('lms.courses.create_dialog_title', 'he', 'צור קורס חדש', 'admin'),
  ('lms.courses.create_dialog_description', 'he', 'הזן את פרטי הקורס למטה. תוכל להוסיף מודולים ושיעורים לאחר יצירת הקורס.', 'admin'),
  ('lms.courses.course_title', 'he', 'כותרת הקורס', 'admin'),
  ('lms.courses.course_title_placeholder', 'he', 'לדוגמה, מבוא לתכנות', 'admin'),
  ('lms.courses.description', 'he', 'תיאור', 'admin'),
  ('lms.courses.description_placeholder', 'he', 'תיאור הקורס...', 'admin'),
  ('lms.courses.program', 'he', 'תוכנית', 'admin'),
  ('lms.courses.select_program', 'he', 'בחר תוכנית', 'admin'),
  ('lms.courses.no_programs', 'he', 'אין תוכניות זמינות', 'admin'),
  ('lms.courses.program_help', 'he', 'בחר את התוכנית שאליה שייך הקורס', 'admin'),
  ('lms.courses.start_date', 'he', 'תאריך התחלה', 'admin'),
  ('lms.courses.end_date', 'he', 'תאריך סיום', 'admin'),
  ('lms.courses.activate_immediately', 'he', 'הפעל קורס מיד', 'admin'),
  ('lms.courses.cancel', 'he', 'ביטול', 'admin'),
  ('lms.courses.creating', 'he', 'יוצר...', 'admin'),
  ('lms.courses.delete_dialog_title', 'he', 'מחק קורס', 'admin'),
  ('lms.courses.delete_dialog_description', 'he', 'האם אתה בטוח שברצונך למחוק את "{title}"? פעולה זו תמחק גם את כל המודולים, השיעורים והתקדמות התלמידים. לא ניתן לבטל פעולה זו.', 'admin'),
  ('lms.courses.deleting', 'he', 'מוחק...', 'admin'),

  -- Course Builder
  ('lms.builder.title', 'he', 'בונה קורסים', 'admin'),
  ('lms.builder.back', 'he', 'חזור', 'admin'),
  ('lms.builder.save', 'he', 'שמור שינויים', 'admin'),
  ('lms.builder.preview', 'he', 'תצוגה מקדימה', 'admin'),
  ('lms.builder.structure', 'he', 'מבנה הקורס', 'admin'),
  ('lms.builder.add', 'he', 'הוסף', 'admin'),
  ('lms.builder.details', 'he', 'פרטי הקורס', 'admin'),
  ('lms.builder.settings', 'he', 'הגדרות', 'admin')
ON CONFLICT (translation_key, language_code) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  context = EXCLUDED.context,
  updated_at = NOW();

-- Verify insertions
SELECT
  'Keys added:' as info,
  COUNT(*) as count
FROM public.translation_keys
WHERE key LIKE 'admin.nav.l%' OR key LIKE 'lms.%';

SELECT
  'Translations added:' as info,
  language_code,
  COUNT(*) as count
FROM public.translations
WHERE translation_key LIKE 'admin.nav.l%' OR translation_key LIKE 'lms.%'
GROUP BY language_code;
