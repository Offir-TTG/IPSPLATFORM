-- ============================================================================
-- LMS Translations Migration (FINAL - CORRECTED WITH MULTI-TENANT SUPPORT)
-- ============================================================================
-- Adds translation entries for the new LMS section in the admin sidebar
-- Uses correct schema: translation_keys (key, category, description, context, tenant_id)
--                      translations (language_code, translation_key, translation_value, category)
-- ============================================================================
-- This migration automatically uses the tenant_id from existing translation_keys
-- No manual tenant setup required!
-- ============================================================================

-- Step 1: Insert all keys into translation_keys table
-- Using tenant_id from an existing translation key to ensure consistency
INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
SELECT
  vals.key,
  vals.category,
  vals.description,
  vals.context,
  (SELECT tenant_id FROM public.translation_keys LIMIT 1) as tenant_id
FROM (VALUES
  -- Navigation
  ('admin.nav.learning', 'admin', 'LMS section title in admin sidebar', 'admin'),
  ('admin.nav.lms_courses', 'admin', 'LMS Courses menu item in admin sidebar', 'admin'),

  -- Course List Page
  ('lms.courses.title', 'lms', 'Course list page title', 'admin'),
  ('lms.courses.subtitle', 'lms', 'Course list page subtitle', 'admin'),
  ('lms.courses.create', 'lms', 'Create course button text', 'admin'),
  ('lms.courses.search_placeholder', 'lms', 'Search courses placeholder', 'admin'),
  ('lms.courses.filter_by_status', 'lms', 'Filter by status placeholder', 'admin'),
  ('lms.courses.all_courses', 'lms', 'All courses filter option', 'admin'),
  ('lms.courses.active', 'lms', 'Active courses filter option', 'admin'),
  ('lms.courses.inactive', 'lms', 'Inactive courses filter option', 'admin'),
  ('lms.courses.loading', 'lms', 'Loading courses message', 'admin'),
  ('lms.courses.no_courses', 'lms', 'Empty state message', 'admin'),
  ('lms.courses.get_started', 'lms', 'Empty state description', 'admin'),
  ('lms.courses.manage', 'lms', 'Manage course button text', 'admin'),
  ('lms.courses.duplicate', 'lms', 'Duplicate course action', 'admin'),
  ('lms.courses.delete', 'lms', 'Delete course action', 'admin'),
  ('lms.courses.edit', 'lms', 'Edit course action', 'admin'),
  ('lms.courses.activate', 'lms', 'Activate course action', 'admin'),
  ('lms.courses.deactivate', 'lms', 'Deactivate course action', 'admin'),
  ('lms.courses.no_instructor', 'lms', 'No instructor assigned message', 'admin'),
  ('lms.courses.create_dialog_title', 'lms', 'Create course dialog title', 'admin'),
  ('lms.courses.create_dialog_description', 'lms', 'Create course dialog description', 'admin'),
  ('lms.courses.course_title', 'lms', 'Course title field label', 'admin'),
  ('lms.courses.course_title_placeholder', 'lms', 'Course title placeholder', 'admin'),
  ('lms.courses.description', 'lms', 'Description field label', 'admin'),
  ('lms.courses.description_placeholder', 'lms', 'Description placeholder', 'admin'),
  ('lms.courses.program', 'lms', 'Program field label', 'admin'),
  ('lms.courses.select_program', 'lms', 'Select program placeholder', 'admin'),
  ('lms.courses.no_programs', 'lms', 'No programs available message', 'admin'),
  ('lms.courses.program_help', 'lms', 'Program field help text', 'admin'),
  ('lms.courses.start_date', 'lms', 'Start date field label', 'admin'),
  ('lms.courses.end_date', 'lms', 'End date field label', 'admin'),
  ('lms.courses.activate_immediately', 'lms', 'Activate immediately checkbox label', 'admin'),
  ('lms.courses.cancel', 'lms', 'Cancel button text', 'admin'),
  ('lms.courses.creating', 'lms', 'Creating state text', 'admin'),
  ('lms.courses.delete_dialog_title', 'lms', 'Delete dialog title', 'admin'),
  ('lms.courses.delete_dialog_description', 'lms', 'Delete dialog description', 'admin'),
  ('lms.courses.deleting', 'lms', 'Deleting state text', 'admin'),

  -- Course Builder
  ('lms.builder.title', 'lms', 'Course builder page title', 'admin'),
  ('lms.builder.back', 'lms', 'Back button text', 'admin'),
  ('lms.builder.save', 'lms', 'Save changes button text', 'admin'),
  ('lms.builder.preview', 'lms', 'Preview button text', 'admin'),
  ('lms.builder.structure', 'lms', 'Course structure section title', 'admin'),
  ('lms.builder.add', 'lms', 'Add button text', 'admin'),
  ('lms.builder.details', 'lms', 'Course details tab title', 'admin'),
  ('lms.builder.settings', 'lms', 'Settings tab title', 'admin')
) AS vals(key, category, description, context)
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  context = EXCLUDED.context,
  tenant_id = EXCLUDED.tenant_id;

-- Step 2: Insert English translations
-- Also using tenant_id from existing translations
INSERT INTO public.translations (language_code, translation_key, translation_value, category, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  (SELECT tenant_id FROM public.translations LIMIT 1) as tenant_id
FROM (VALUES
  -- Navigation
  ('en', 'admin.nav.learning', 'Learning', 'admin'),
  ('en', 'admin.nav.lms_courses', 'LMS Courses', 'admin'),

  -- Course List Page
  ('en', 'lms.courses.title', 'Courses', 'lms'),
  ('en', 'lms.courses.subtitle', 'Manage your courses, modules, and lessons', 'lms'),
  ('en', 'lms.courses.create', 'Create Course', 'lms'),
  ('en', 'lms.courses.search_placeholder', 'Search courses...', 'lms'),
  ('en', 'lms.courses.filter_by_status', 'Filter by status', 'lms'),
  ('en', 'lms.courses.all_courses', 'All Courses', 'lms'),
  ('en', 'lms.courses.active', 'Active', 'lms'),
  ('en', 'lms.courses.inactive', 'Inactive', 'lms'),
  ('en', 'lms.courses.loading', 'Loading courses...', 'lms'),
  ('en', 'lms.courses.no_courses', 'No courses found', 'lms'),
  ('en', 'lms.courses.get_started', 'Get started by creating your first course', 'lms'),
  ('en', 'lms.courses.manage', 'Manage Course', 'lms'),
  ('en', 'lms.courses.duplicate', 'Duplicate', 'lms'),
  ('en', 'lms.courses.delete', 'Delete', 'lms'),
  ('en', 'lms.courses.edit', 'Edit Course', 'lms'),
  ('en', 'lms.courses.activate', 'Activate', 'lms'),
  ('en', 'lms.courses.deactivate', 'Deactivate', 'lms'),
  ('en', 'lms.courses.no_instructor', 'No instructor', 'lms'),
  ('en', 'lms.courses.create_dialog_title', 'Create New Course', 'lms'),
  ('en', 'lms.courses.create_dialog_description', 'Enter the course details below. You can add modules and lessons after creating the course.', 'lms'),
  ('en', 'lms.courses.course_title', 'Course Title', 'lms'),
  ('en', 'lms.courses.course_title_placeholder', 'e.g., Introduction to Programming', 'lms'),
  ('en', 'lms.courses.description', 'Description', 'lms'),
  ('en', 'lms.courses.description_placeholder', 'Course description...', 'lms'),
  ('en', 'lms.courses.program', 'Program', 'lms'),
  ('en', 'lms.courses.select_program', 'Select a program', 'lms'),
  ('en', 'lms.courses.no_programs', 'No programs available', 'lms'),
  ('en', 'lms.courses.program_help', 'Select the program this course belongs to', 'lms'),
  ('en', 'lms.courses.start_date', 'Start Date', 'lms'),
  ('en', 'lms.courses.end_date', 'End Date', 'lms'),
  ('en', 'lms.courses.activate_immediately', 'Activate course immediately', 'lms'),
  ('en', 'lms.courses.cancel', 'Cancel', 'lms'),
  ('en', 'lms.courses.creating', 'Creating...', 'lms'),
  ('en', 'lms.courses.delete_dialog_title', 'Delete Course', 'lms'),
  ('en', 'lms.courses.delete_dialog_description', 'Are you sure you want to delete "{title}"? This will also delete all modules, lessons, and student progress. This action cannot be undone.', 'lms'),
  ('en', 'lms.courses.deleting', 'Deleting...', 'lms'),

  -- Course Builder
  ('en', 'lms.builder.title', 'Course Builder', 'lms'),
  ('en', 'lms.builder.back', 'Back', 'lms'),
  ('en', 'lms.builder.save', 'Save Changes', 'lms'),
  ('en', 'lms.builder.preview', 'Preview', 'lms'),
  ('en', 'lms.builder.structure', 'Course Structure', 'lms'),
  ('en', 'lms.builder.add', 'Add', 'lms'),
  ('en', 'lms.builder.details', 'Course Details', 'lms'),
  ('en', 'lms.builder.settings', 'Settings', 'lms')
) AS vals(language_code, translation_key, translation_value, category)
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Step 3: Insert Hebrew translations
INSERT INTO public.translations (language_code, translation_key, translation_value, category, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  (SELECT tenant_id FROM public.translations LIMIT 1) as tenant_id
FROM (VALUES
  -- Navigation
  ('he', 'admin.nav.learning', 'למידה', 'admin'),
  ('he', 'admin.nav.lms_courses', 'קורסי LMS', 'admin'),

  -- Course List Page
  ('he', 'lms.courses.title', 'קורסים', 'lms'),
  ('he', 'lms.courses.subtitle', 'נהל את הקורסים, המודולים והשיעורים שלך', 'lms'),
  ('he', 'lms.courses.create', 'צור קורס', 'lms'),
  ('he', 'lms.courses.search_placeholder', 'חפש קורסים...', 'lms'),
  ('he', 'lms.courses.filter_by_status', 'סנן לפי סטטוס', 'lms'),
  ('he', 'lms.courses.all_courses', 'כל הקורסים', 'lms'),
  ('he', 'lms.courses.active', 'פעיל', 'lms'),
  ('he', 'lms.courses.inactive', 'לא פעיל', 'lms'),
  ('he', 'lms.courses.loading', 'טוען קורסים...', 'lms'),
  ('he', 'lms.courses.no_courses', 'לא נמצאו קורסים', 'lms'),
  ('he', 'lms.courses.get_started', 'התחל ביצירת הקורס הראשון שלך', 'lms'),
  ('he', 'lms.courses.manage', 'נהל קורס', 'lms'),
  ('he', 'lms.courses.duplicate', 'שכפל', 'lms'),
  ('he', 'lms.courses.delete', 'מחק', 'lms'),
  ('he', 'lms.courses.edit', 'ערוך קורס', 'lms'),
  ('he', 'lms.courses.activate', 'הפעל', 'lms'),
  ('he', 'lms.courses.deactivate', 'השבת', 'lms'),
  ('he', 'lms.courses.no_instructor', 'אין מדריך', 'lms'),
  ('he', 'lms.courses.create_dialog_title', 'צור קורס חדש', 'lms'),
  ('he', 'lms.courses.create_dialog_description', 'הזן את פרטי הקורס למטה. תוכל להוסיף מודולים ושיעורים לאחר יצירת הקורס.', 'lms'),
  ('he', 'lms.courses.course_title', 'כותרת הקורס', 'lms'),
  ('he', 'lms.courses.course_title_placeholder', 'לדוגמה, מבוא לתכנות', 'lms'),
  ('he', 'lms.courses.description', 'תיאור', 'lms'),
  ('he', 'lms.courses.description_placeholder', 'תיאור הקורס...', 'lms'),
  ('he', 'lms.courses.program', 'תוכנית', 'lms'),
  ('he', 'lms.courses.select_program', 'בחר תוכנית', 'lms'),
  ('he', 'lms.courses.no_programs', 'אין תוכניות זמינות', 'lms'),
  ('he', 'lms.courses.program_help', 'בחר את התוכנית שאליה שייך הקורס', 'lms'),
  ('he', 'lms.courses.start_date', 'תאריך התחלה', 'lms'),
  ('he', 'lms.courses.end_date', 'תאריך סיום', 'lms'),
  ('he', 'lms.courses.activate_immediately', 'הפעל קורס מיד', 'lms'),
  ('he', 'lms.courses.cancel', 'ביטול', 'lms'),
  ('he', 'lms.courses.creating', 'יוצר...', 'lms'),
  ('he', 'lms.courses.delete_dialog_title', 'מחק קורס', 'lms'),
  ('he', 'lms.courses.delete_dialog_description', 'האם אתה בטוח שברצונך למחוק את "{title}"? פעולה זו תמחק גם את כל המודולים, השיעורים והתקדמות התלמידים. לא ניתן לבטל פעולה זו.', 'lms'),
  ('he', 'lms.courses.deleting', 'מוחק...', 'lms'),

  -- Course Builder
  ('he', 'lms.builder.title', 'בונה קורסים', 'lms'),
  ('he', 'lms.builder.back', 'חזור', 'lms'),
  ('he', 'lms.builder.save', 'שמור שינויים', 'lms'),
  ('he', 'lms.builder.preview', 'תצוגה מקדימה', 'lms'),
  ('he', 'lms.builder.structure', 'מבנה הקורס', 'lms'),
  ('he', 'lms.builder.add', 'הוסף', 'lms'),
  ('he', 'lms.builder.details', 'פרטי הקורס', 'lms'),
  ('he', 'lms.builder.settings', 'הגדרות', 'lms')
) AS vals(language_code, translation_key, translation_value, category)
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  tenant_id = EXCLUDED.tenant_id,
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
