-- =====================================================
-- ADD STUDENT GRADES VIEW TRANSLATIONS
-- =====================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing translations to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key LIKE 'user.grades.%';

  -- Insert all translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Student Grades Page Header
  (v_tenant_id, 'en', 'user.grades.title', 'My Grades', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.title', 'הציונים שלי', 'user', NOW(), NOW()),

  -- Summary Cards
  (v_tenant_id, 'en', 'user.grades.overallGrade', 'Overall Grade', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.overallGrade', 'ציון כללי', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.pointsEarned', 'Points Earned', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.pointsEarned', 'נקודות שהושגו', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.totalPoints', 'Total Points', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.totalPoints', 'סה"כ נקודות', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.assignments', 'Assignments', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.assignments', 'מטלות', 'user', NOW(), NOW()),

  -- Categories Section
  (v_tenant_id, 'en', 'user.grades.categories.title', 'Grade Categories', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.categories.title', 'קטגוריות ציונים', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.categories.weight', 'Weight', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.categories.weight', 'משקל', 'user', NOW(), NOW()),

  -- Assignments Section
  (v_tenant_id, 'en', 'user.grades.assignments.title', 'All Assignments', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.assignments.title', 'כל המטלות', 'user', NOW(), NOW()),

  -- Grade Status
  (v_tenant_id, 'en', 'user.grades.excused', 'Excused', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.excused', 'פטור', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.notGraded', 'Not Graded', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.notGraded', 'לא מדורג', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.feedback', 'Feedback', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.feedback', 'משוב', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.gradedOn', 'Graded on', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.gradedOn', 'דורג ב', 'user', NOW(), NOW()),

  -- Empty State
  (v_tenant_id, 'en', 'user.grades.empty.title', 'No Grades Yet', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.empty.title', 'עדיין אין ציונים', 'user', NOW(), NOW()),
  (v_tenant_id, 'en', 'user.grades.empty.description', 'Your grades will appear here once they are posted', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.empty.description', 'הציונים שלך יופיעו כאן ברגע שיפורסמו', 'user', NOW(), NOW()),

  -- Errors
  (v_tenant_id, 'en', 'user.grades.error.load', 'Failed to load grades', 'user', NOW(), NOW()),
  (v_tenant_id, 'he', 'user.grades.error.load', 'נכשל בטעינת הציונים', 'user', NOW(), NOW());

  RAISE NOTICE '✅ Added student grades view translations';
  RAISE NOTICE 'Total translations added: 14 keys × 2 languages = 28 entries';
END $$;
