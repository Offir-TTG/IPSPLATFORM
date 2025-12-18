-- Add missing attendance filter translations
-- Adds translations for program and course filters in attendance page

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing filter translations if they exist
  DELETE FROM public.translations
  WHERE translation_key IN (
    'admin.attendance.program',
    'admin.attendance.course',
    'admin.attendance.allPrograms',
    'admin.attendance.allCourses',
    'admin.attendance.selectProgram',
    'admin.attendance.selectCourse',
    'admin.attendance.noProgramsFound',
    'admin.attendance.noCoursesFound',
    'admin.attendance.clearAll'
  );

  -- Insert new filter translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Program filter
  (v_tenant_id, 'en', 'admin.attendance.program', 'Program', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.program', 'תוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.allPrograms', 'All Programs', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.allPrograms', 'כל התוכניות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.selectProgram', 'Select program...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.selectProgram', 'בחר תוכנית...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.noProgramsFound', 'No programs found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.noProgramsFound', 'לא נמצאו תוכניות', 'admin', NOW(), NOW()),

  -- Course filter
  (v_tenant_id, 'en', 'admin.attendance.course', 'Course', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.course', 'קורס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.allCourses', 'All Courses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.allCourses', 'כל הקורסים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.selectCourse', 'Select course...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.selectCourse', 'בחר קורס...', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.attendance.noCoursesFound', 'No courses found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.noCoursesFound', 'לא נמצאו קורסים', 'admin', NOW(), NOW()),

  -- Clear All button
  (v_tenant_id, 'en', 'admin.attendance.clearAll', 'Clear All', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.attendance.clearAll', 'נקה הכל', 'admin', NOW(), NOW());

  RAISE NOTICE '✅ Added attendance filter translations';
  RAISE NOTICE 'Total translations added: 9 keys × 2 languages = 18 entries';
END $$;
