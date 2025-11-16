-- ============================================================================
-- LMS Navigation Translations Migration
-- ============================================================================
-- Adds translation entries for the new LMS section in the admin sidebar
-- Uses ui_text_config (keys) and ui_text_values (translations) tables
-- ============================================================================

-- Step 1: Insert all keys into ui_text_config
INSERT INTO ui_text_config (key, category, default_value, description)
VALUES
  -- Navigation
  ('admin.nav.learning', 'admin_navigation', 'Learning', 'LMS section title in admin sidebar'),
  ('admin.nav.lms_courses', 'admin_navigation', 'LMS Courses', 'LMS Courses menu item in admin sidebar'),

  -- Course List Page
  ('lms.courses.title', 'lms', 'Courses', 'Course list page title'),
  ('lms.courses.subtitle', 'lms', 'Manage your courses, modules, and lessons', 'Course list page subtitle'),
  ('lms.courses.create', 'lms', 'Create Course', 'Create course button text'),
  ('lms.courses.search_placeholder', 'lms', 'Search courses...', 'Search courses placeholder'),
  ('lms.courses.filter_by_status', 'lms', 'Filter by status', 'Filter by status placeholder'),
  ('lms.courses.all_courses', 'lms', 'All Courses', 'All courses filter option'),
  ('lms.courses.active', 'lms', 'Active', 'Active courses filter option'),
  ('lms.courses.inactive', 'lms', 'Inactive', 'Inactive courses filter option'),
  ('lms.courses.loading', 'lms', 'Loading courses...', 'Loading courses message'),
  ('lms.courses.no_courses', 'lms', 'No courses found', 'Empty state message'),
  ('lms.courses.get_started', 'lms', 'Get started by creating your first course', 'Empty state description'),
  ('lms.courses.manage', 'lms', 'Manage Course', 'Manage course button text'),
  ('lms.courses.duplicate', 'lms', 'Duplicate', 'Duplicate course action'),
  ('lms.courses.delete', 'lms', 'Delete', 'Delete course action'),
  ('lms.courses.edit', 'lms', 'Edit Course', 'Edit course action'),
  ('lms.courses.activate', 'lms', 'Activate', 'Activate course action'),
  ('lms.courses.deactivate', 'lms', 'Deactivate', 'Deactivate course action'),
  ('lms.courses.no_instructor', 'lms', 'No instructor', 'No instructor assigned message'),
  ('lms.courses.create_dialog_title', 'lms', 'Create New Course', 'Create course dialog title'),
  ('lms.courses.create_dialog_description', 'lms', 'Enter the course details below. You can add modules and lessons after creating the course.', 'Create course dialog description'),
  ('lms.courses.course_title', 'lms', 'Course Title', 'Course title field label'),
  ('lms.courses.course_title_placeholder', 'lms', 'e.g., Introduction to Programming', 'Course title placeholder'),
  ('lms.courses.description', 'lms', 'Description', 'Description field label'),
  ('lms.courses.description_placeholder', 'lms', 'Course description...', 'Description placeholder'),
  ('lms.courses.program', 'lms', 'Program', 'Program field label'),
  ('lms.courses.select_program', 'lms', 'Select a program', 'Select program placeholder'),
  ('lms.courses.no_programs', 'lms', 'No programs available', 'No programs available message'),
  ('lms.courses.program_help', 'lms', 'Select the program this course belongs to', 'Program field help text'),
  ('lms.courses.start_date', 'lms', 'Start Date', 'Start date field label'),
  ('lms.courses.end_date', 'lms', 'End Date', 'End date field label'),
  ('lms.courses.activate_immediately', 'lms', 'Activate course immediately', 'Activate immediately checkbox label'),
  ('lms.courses.cancel', 'lms', 'Cancel', 'Cancel button text'),
  ('lms.courses.creating', 'lms', 'Creating...', 'Creating state text'),
  ('lms.courses.delete_dialog_title', 'lms', 'Delete Course', 'Delete dialog title'),
  ('lms.courses.delete_dialog_description', 'lms', 'Are you sure you want to delete "{title}"? This will also delete all modules, lessons, and student progress. This action cannot be undone.', 'Delete dialog description'),
  ('lms.courses.deleting', 'lms', 'Deleting...', 'Deleting state text'),

  -- Course Builder
  ('lms.builder.title', 'lms', 'Course Builder', 'Course builder page title'),
  ('lms.builder.back', 'lms', 'Back', 'Back button text'),
  ('lms.builder.save', 'lms', 'Save Changes', 'Save changes button text'),
  ('lms.builder.preview', 'lms', 'Preview', 'Preview button text'),
  ('lms.builder.structure', 'lms', 'Course Structure', 'Course structure section title'),
  ('lms.builder.add', 'lms', 'Add', 'Add button text'),
  ('lms.builder.details', 'lms', 'Course Details', 'Course details tab title'),
  ('lms.builder.settings', 'lms', 'Settings', 'Settings tab title'),

  -- Modules
  ('lms.modules.add_single', 'lms', 'Add Single Module', 'Add single module action'),
  ('lms.modules.add_bulk', 'lms', 'Add 10 Modules', 'Add bulk modules action'),
  ('lms.modules.title', 'lms', 'Module Title', 'Module title field label'),
  ('lms.modules.description', 'lms', 'Description', 'Module description field label'),
  ('lms.modules.delete', 'lms', 'Delete Module', 'Delete module action'),
  ('lms.modules.no_modules', 'lms', 'No modules yet', 'Empty modules message'),

  -- Lessons
  ('lms.lessons.add_single', 'lms', 'Add Lesson', 'Add single lesson action'),
  ('lms.lessons.add_bulk', 'lms', 'Add 10 Lessons', 'Add bulk lessons action'),
  ('lms.lessons.title', 'lms', 'Lesson Title', 'Lesson title field label'),
  ('lms.lessons.description', 'lms', 'Description', 'Lesson description field label'),
  ('lms.lessons.start_time', 'lms', 'Start Time', 'Lesson start time field label'),
  ('lms.lessons.duration', 'lms', 'Duration (minutes)', 'Lesson duration field label'),
  ('lms.lessons.delete', 'lms', 'Delete Lesson', 'Delete lesson action'),

  -- Bulk Creator
  ('lms.bulk.title_modules', 'lms', 'Add Modules', 'Bulk add modules dialog title'),
  ('lms.bulk.title_lessons', 'lms', 'Add Lessons', 'Bulk add lessons dialog title'),
  ('lms.bulk.count', 'lms', 'Number of items', 'Number of items field label'),
  ('lms.bulk.pattern', 'lms', 'Title Pattern', 'Title pattern field label'),
  ('lms.bulk.pattern_help', 'lms', 'Use {n} for numbering', 'Title pattern help text'),
  ('lms.bulk.preview', 'lms', 'Preview', 'Preview section title'),
  ('lms.bulk.create', 'lms', 'Create Items', 'Create items button text'),
  ('lms.bulk.cancel', 'lms', 'Cancel', 'Cancel button text'),
  ('lms.bulk.interval_days', 'lms', 'Days Between Lessons', 'Days between lessons field label'),
  ('lms.bulk.first_lesson_date', 'lms', 'First Lesson Date', 'First lesson date field label'),

  -- Form Fields
  ('lms.form.course_title', 'lms', 'Course Title', 'Course title field label'),
  ('lms.form.course_description', 'lms', 'Course description...', 'Course description placeholder'),
  ('lms.form.program_id', 'lms', 'Program ID', 'Program ID field label'),
  ('lms.form.start_date', 'lms', 'Start Date', 'Start date field label'),
  ('lms.form.end_date', 'lms', 'End Date', 'End date field label'),
  ('lms.form.is_active', 'lms', 'Course is active (visible to students)', 'Course active checkbox label'),
  ('lms.form.activate_immediately', 'lms', 'Activate course immediately', 'Activate immediately checkbox label'),

  -- Statistics
  ('lms.stats.modules', 'lms', 'Modules', 'Modules count label'),
  ('lms.stats.lessons', 'lms', 'Lessons', 'Lessons count label'),
  ('lms.stats.published', 'lms', 'Published', 'Published count label'),

  -- Actions
  ('lms.action.saving', 'lms', 'Saving...', 'Saving state text'),
  ('lms.action.creating', 'lms', 'Creating...', 'Creating state text'),
  ('lms.action.deleting', 'lms', 'Deleting...', 'Deleting state text'),
  ('lms.action.loading', 'lms', 'Loading...', 'Loading state text'),

  -- Messages
  ('lms.msg.create_success', 'lms', 'Course created successfully', 'Course created success message'),
  ('lms.msg.update_success', 'lms', 'Course updated successfully', 'Course updated success message'),
  ('lms.msg.delete_success', 'lms', 'Course deleted successfully', 'Course deleted success message'),
  ('lms.msg.delete_confirm', 'lms', 'Are you sure you want to delete this course? This will also delete all modules, lessons, and student progress. This action cannot be undone.', 'Course delete confirmation message'),
  ('lms.msg.duplicate_confirm', 'lms', 'Duplicate this course?', 'Course duplicate confirmation message'),
  ('lms.msg.module_delete_confirm', 'lms', 'Delete this module? This will also delete all lessons.', 'Module delete confirmation message'),
  ('lms.msg.lesson_delete_confirm', 'lms', 'Delete this lesson?', 'Lesson delete confirmation message')
ON CONFLICT (key) DO UPDATE SET
  default_value = EXCLUDED.default_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Step 2: Insert English translations
INSERT INTO ui_text_values (text_key, language_code, value)
VALUES
  -- Navigation
  ('admin.nav.learning', 'en', 'Learning'),
  ('admin.nav.lms_courses', 'en', 'LMS Courses'),

  -- Course List Page
  ('lms.courses.title', 'en', 'Courses'),
  ('lms.courses.subtitle', 'en', 'Manage your courses, modules, and lessons'),
  ('lms.courses.create', 'en', 'Create Course'),
  ('lms.courses.search_placeholder', 'en', 'Search courses...'),
  ('lms.courses.filter_by_status', 'en', 'Filter by status'),
  ('lms.courses.all_courses', 'en', 'All Courses'),
  ('lms.courses.active', 'en', 'Active'),
  ('lms.courses.inactive', 'en', 'Inactive'),
  ('lms.courses.loading', 'en', 'Loading courses...'),
  ('lms.courses.no_courses', 'en', 'No courses found'),
  ('lms.courses.get_started', 'en', 'Get started by creating your first course'),
  ('lms.courses.manage', 'en', 'Manage Course'),
  ('lms.courses.duplicate', 'en', 'Duplicate'),
  ('lms.courses.delete', 'en', 'Delete'),
  ('lms.courses.edit', 'en', 'Edit Course'),
  ('lms.courses.activate', 'en', 'Activate'),
  ('lms.courses.deactivate', 'en', 'Deactivate'),
  ('lms.courses.no_instructor', 'en', 'No instructor'),
  ('lms.courses.create_dialog_title', 'en', 'Create New Course'),
  ('lms.courses.create_dialog_description', 'en', 'Enter the course details below. You can add modules and lessons after creating the course.'),
  ('lms.courses.course_title', 'en', 'Course Title'),
  ('lms.courses.course_title_placeholder', 'en', 'e.g., Introduction to Programming'),
  ('lms.courses.description', 'en', 'Description'),
  ('lms.courses.description_placeholder', 'en', 'Course description...'),
  ('lms.courses.program', 'en', 'Program'),
  ('lms.courses.select_program', 'en', 'Select a program'),
  ('lms.courses.no_programs', 'en', 'No programs available'),
  ('lms.courses.program_help', 'en', 'Select the program this course belongs to'),
  ('lms.courses.start_date', 'en', 'Start Date'),
  ('lms.courses.end_date', 'en', 'End Date'),
  ('lms.courses.activate_immediately', 'en', 'Activate course immediately'),
  ('lms.courses.cancel', 'en', 'Cancel'),
  ('lms.courses.creating', 'en', 'Creating...'),
  ('lms.courses.delete_dialog_title', 'en', 'Delete Course'),
  ('lms.courses.delete_dialog_description', 'en', 'Are you sure you want to delete "{title}"? This will also delete all modules, lessons, and student progress. This action cannot be undone.'),
  ('lms.courses.deleting', 'en', 'Deleting...'),

  -- Course Builder
  ('lms.builder.title', 'en', 'Course Builder'),
  ('lms.builder.back', 'en', 'Back'),
  ('lms.builder.save', 'en', 'Save Changes'),
  ('lms.builder.preview', 'en', 'Preview'),
  ('lms.builder.structure', 'en', 'Course Structure'),
  ('lms.builder.add', 'en', 'Add'),
  ('lms.builder.details', 'en', 'Course Details'),
  ('lms.builder.settings', 'en', 'Settings'),

  -- Modules
  ('lms.modules.add_single', 'en', 'Add Single Module'),
  ('lms.modules.add_bulk', 'en', 'Add 10 Modules'),
  ('lms.modules.title', 'en', 'Module Title'),
  ('lms.modules.description', 'en', 'Description'),
  ('lms.modules.delete', 'en', 'Delete Module'),
  ('lms.modules.no_modules', 'en', 'No modules yet'),

  -- Lessons
  ('lms.lessons.add_single', 'en', 'Add Lesson'),
  ('lms.lessons.add_bulk', 'en', 'Add 10 Lessons'),
  ('lms.lessons.title', 'en', 'Lesson Title'),
  ('lms.lessons.description', 'en', 'Description'),
  ('lms.lessons.start_time', 'en', 'Start Time'),
  ('lms.lessons.duration', 'en', 'Duration (minutes)'),
  ('lms.lessons.delete', 'en', 'Delete Lesson'),

  -- Bulk Creator
  ('lms.bulk.title_modules', 'en', 'Add Modules'),
  ('lms.bulk.title_lessons', 'en', 'Add Lessons'),
  ('lms.bulk.count', 'en', 'Number of items'),
  ('lms.bulk.pattern', 'en', 'Title Pattern'),
  ('lms.bulk.pattern_help', 'en', 'Use {n} for numbering'),
  ('lms.bulk.preview', 'en', 'Preview'),
  ('lms.bulk.create', 'en', 'Create Items'),
  ('lms.bulk.cancel', 'en', 'Cancel'),
  ('lms.bulk.interval_days', 'en', 'Days Between Lessons'),
  ('lms.bulk.first_lesson_date', 'en', 'First Lesson Date'),

  -- Form Fields
  ('lms.form.course_title', 'en', 'Course Title'),
  ('lms.form.course_description', 'en', 'Course description...'),
  ('lms.form.program_id', 'en', 'Program ID'),
  ('lms.form.start_date', 'en', 'Start Date'),
  ('lms.form.end_date', 'en', 'End Date'),
  ('lms.form.is_active', 'en', 'Course is active (visible to students)'),
  ('lms.form.activate_immediately', 'en', 'Activate course immediately'),

  -- Statistics
  ('lms.stats.modules', 'en', 'Modules'),
  ('lms.stats.lessons', 'en', 'Lessons'),
  ('lms.stats.published', 'en', 'Published'),

  -- Actions
  ('lms.action.saving', 'en', 'Saving...'),
  ('lms.action.creating', 'en', 'Creating...'),
  ('lms.action.deleting', 'en', 'Deleting...'),
  ('lms.action.loading', 'en', 'Loading...'),

  -- Messages
  ('lms.msg.create_success', 'en', 'Course created successfully'),
  ('lms.msg.update_success', 'en', 'Course updated successfully'),
  ('lms.msg.delete_success', 'en', 'Course deleted successfully'),
  ('lms.msg.delete_confirm', 'en', 'Are you sure you want to delete this course? This will also delete all modules, lessons, and student progress. This action cannot be undone.'),
  ('lms.msg.duplicate_confirm', 'en', 'Duplicate this course?'),
  ('lms.msg.module_delete_confirm', 'en', 'Delete this module? This will also delete all lessons.'),
  ('lms.msg.lesson_delete_confirm', 'en', 'Delete this lesson?')
ON CONFLICT (text_key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Step 3: Insert Hebrew translations
INSERT INTO ui_text_values (text_key, language_code, value)
VALUES
  -- Navigation
  ('admin.nav.learning', 'he', 'למידה'),
  ('admin.nav.lms_courses', 'he', 'קורסי LMS'),

  -- Course List Page
  ('lms.courses.title', 'he', 'קורסים'),
  ('lms.courses.subtitle', 'he', 'נהל את הקורסים, המודולים והשיעורים שלך'),
  ('lms.courses.create', 'he', 'צור קורס'),
  ('lms.courses.search_placeholder', 'he', 'חפש קורסים...'),
  ('lms.courses.filter_by_status', 'he', 'סנן לפי סטטוס'),
  ('lms.courses.all_courses', 'he', 'כל הקורסים'),
  ('lms.courses.active', 'he', 'פעיל'),
  ('lms.courses.inactive', 'he', 'לא פעיל'),
  ('lms.courses.loading', 'he', 'טוען קורסים...'),
  ('lms.courses.no_courses', 'he', 'לא נמצאו קורסים'),
  ('lms.courses.get_started', 'he', 'התחל ביצירת הקורס הראשון שלך'),
  ('lms.courses.manage', 'he', 'נהל קורס'),
  ('lms.courses.duplicate', 'he', 'שכפל'),
  ('lms.courses.delete', 'he', 'מחק'),
  ('lms.courses.edit', 'he', 'ערוך קורס'),
  ('lms.courses.activate', 'he', 'הפעל'),
  ('lms.courses.deactivate', 'he', 'השבת'),
  ('lms.courses.no_instructor', 'he', 'אין מדריך'),
  ('lms.courses.create_dialog_title', 'he', 'צור קורס חדש'),
  ('lms.courses.create_dialog_description', 'he', 'הזן את פרטי הקורס למטה. תוכל להוסיף מודולים ושיעורים לאחר יצירת הקורס.'),
  ('lms.courses.course_title', 'he', 'כותרת הקורס'),
  ('lms.courses.course_title_placeholder', 'he', 'לדוגמה, מבוא לתכנות'),
  ('lms.courses.description', 'he', 'תיאור'),
  ('lms.courses.description_placeholder', 'he', 'תיאור הקורס...'),
  ('lms.courses.program', 'he', 'תוכנית'),
  ('lms.courses.select_program', 'he', 'בחר תוכנית'),
  ('lms.courses.no_programs', 'he', 'אין תוכניות זמינות'),
  ('lms.courses.program_help', 'he', 'בחר את התוכנית שאליה שייך הקורס'),
  ('lms.courses.start_date', 'he', 'תאריך התחלה'),
  ('lms.courses.end_date', 'he', 'תאריך סיום'),
  ('lms.courses.activate_immediately', 'he', 'הפעל קורס מיד'),
  ('lms.courses.cancel', 'he', 'ביטול'),
  ('lms.courses.creating', 'he', 'יוצר...'),
  ('lms.courses.delete_dialog_title', 'he', 'מחק קורס'),
  ('lms.courses.delete_dialog_description', 'he', 'האם אתה בטוח שברצונך למחוק את "{title}"? פעולה זו תמחק גם את כל המודולים, השיעורים והתקדמות התלמידים. לא ניתן לבטל פעולה זו.'),
  ('lms.courses.deleting', 'he', 'מוחק...'),

  -- Course Builder
  ('lms.builder.title', 'he', 'בונה קורסים'),
  ('lms.builder.back', 'he', 'חזור'),
  ('lms.builder.save', 'he', 'שמור שינויים'),
  ('lms.builder.preview', 'he', 'תצוגה מקדימה'),
  ('lms.builder.structure', 'he', 'מבנה הקורס'),
  ('lms.builder.add', 'he', 'הוסף'),
  ('lms.builder.details', 'he', 'פרטי הקורס'),
  ('lms.builder.settings', 'he', 'הגדרות'),

  -- Modules
  ('lms.modules.add_single', 'he', 'הוסף מודול בודד'),
  ('lms.modules.add_bulk', 'he', 'הוסף 10 מודולים'),
  ('lms.modules.title', 'he', 'כותרת מודול'),
  ('lms.modules.description', 'he', 'תיאור'),
  ('lms.modules.delete', 'he', 'מחק מודול'),
  ('lms.modules.no_modules', 'he', 'אין מודולים עדיין'),

  -- Lessons
  ('lms.lessons.add_single', 'he', 'הוסף שיעור'),
  ('lms.lessons.add_bulk', 'he', 'הוסף 10 שיעורים'),
  ('lms.lessons.title', 'he', 'כותרת שיעור'),
  ('lms.lessons.description', 'he', 'תיאור'),
  ('lms.lessons.start_time', 'he', 'זמן התחלה'),
  ('lms.lessons.duration', 'he', 'משך (דקות)'),
  ('lms.lessons.delete', 'he', 'מחק שיעור'),

  -- Bulk Creator
  ('lms.bulk.title_modules', 'he', 'הוסף מודולים'),
  ('lms.bulk.title_lessons', 'he', 'הוסף שיעורים'),
  ('lms.bulk.count', 'he', 'מספר פריטים'),
  ('lms.bulk.pattern', 'he', 'תבנית כותרת'),
  ('lms.bulk.pattern_help', 'he', 'השתמש ב-{n} למספור'),
  ('lms.bulk.preview', 'he', 'תצוגה מקדימה'),
  ('lms.bulk.create', 'he', 'צור פריטים'),
  ('lms.bulk.cancel', 'he', 'ביטול'),
  ('lms.bulk.interval_days', 'he', 'ימים בין שיעורים'),
  ('lms.bulk.first_lesson_date', 'he', 'תאריך שיעור ראשון'),

  -- Form Fields
  ('lms.form.course_title', 'he', 'כותרת הקורס'),
  ('lms.form.course_description', 'he', 'תיאור הקורס...'),
  ('lms.form.program_id', 'he', 'מזהה תוכנית'),
  ('lms.form.start_date', 'he', 'תאריך התחלה'),
  ('lms.form.end_date', 'he', 'תאריך סיום'),
  ('lms.form.is_active', 'he', 'הקורס פעיל (נראה לתלמידים)'),
  ('lms.form.activate_immediately', 'he', 'הפעל קורס מיד'),

  -- Statistics
  ('lms.stats.modules', 'he', 'מודולים'),
  ('lms.stats.lessons', 'he', 'שיעורים'),
  ('lms.stats.published', 'he', 'מפורסם'),

  -- Actions
  ('lms.action.saving', 'he', 'שומר...'),
  ('lms.action.creating', 'he', 'יוצר...'),
  ('lms.action.deleting', 'he', 'מוחק...'),
  ('lms.action.loading', 'he', 'טוען...'),

  -- Messages
  ('lms.msg.create_success', 'he', 'הקורס נוצר בהצלחה'),
  ('lms.msg.update_success', 'he', 'הקורס עודכן בהצלחה'),
  ('lms.msg.delete_success', 'he', 'הקורס נמחק בהצלחה'),
  ('lms.msg.delete_confirm', 'he', 'האם אתה בטוח שברצונך למחוק קורס זה? פעולה זו תמחק גם את כל המודולים, השיעורים והתקדמות התלמידים. לא ניתן לבטל פעולה זו.'),
  ('lms.msg.duplicate_confirm', 'he', 'שכפל קורס זה?'),
  ('lms.msg.module_delete_confirm', 'he', 'מחק מודול זה? פעולה זו תמחק גם את כל השיעורים.'),
  ('lms.msg.lesson_delete_confirm', 'he', 'מחק שיעור זה?')
ON CONFLICT (text_key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Verify insertions
SELECT
  'Keys added:' as info,
  COUNT(*) as count
FROM ui_text_config
WHERE key LIKE 'admin.nav.l%' OR key LIKE 'lms.%';

SELECT
  'Translations added:' as info,
  language_code,
  COUNT(*) as count
FROM ui_text_values
WHERE text_key LIKE 'admin.nav.l%' OR text_key LIKE 'lms.%'
GROUP BY language_code;
